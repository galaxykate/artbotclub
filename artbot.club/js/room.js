const defaultChatID = "DEFAULT_CHAT"
// A place for bots and humans to chat
// Comes with a default
function Room(chanceryTemplates) {

	this.participants = {}
	this.channels = {}
	this.columns = [];


	this.isHeadless = true;

	//this.createChannel("canvas", 2, "drawing", {});
	this.createChannel("chat", 2, defaultChatID, {});
	this.createParticipant();

	if (chanceryTemplates)
		chanceryTemplates.forEach(template => {
			//console.log("CREATE BOT FOR TEMPLATE", template)
			this.createParticipant(template);

		})

}

Room.prototype.setToChiclet = function(div, participant) {
	// Make this div
	div.addClass("chiclet");
	div.html(participant.id)
	div.css({
		color: participant.idColor.toCSS(-.4),
		backgroundColor: participant.idColor.toCSS(.4)
	})

}

Room.prototype.createUI = function(holder) {

	this.isHeadless = false;
	this.columnCount = 3;
	let columnHolder = $("<div/>", {
		class: "column-holder"
	}).appendTo(holder);
	for (var i = 0; i < this.columnCount; i++) {
		this.columns[i] = $("<div/>", {
			class: "column"
		}).appendTo(columnHolder)
	}

	// Create the controlUI 
	this.controlCard = createChannelCard(this.columns[0], "roomcontrols", "roomcontrols");

	this.addParticipantControl = selectWidget({
		holder: this.controlCard.content,
		label: "add:",
		goLabel: "+",
		ids: ["human"].concat(availableChanceries.map(s => s.id)),
		onSelect: (id) => {
			this.createParticipant(id);
		},
		getLabel: (id) => {
			if (testChanceries[id])
				return testChanceries[id].title
			return id
		}
	});

	this.participantsHolder = $("<div/>", {

	}).appendTo(this.controlCard.content);
	this.participantsUI = {

	}
	this.refreshParticipantUI();

	this.forChannels((key, channel) => {

		channel.createUI(this.columns[channel.uiColumn])
	})
}

Room.prototype.createParticipant = function(chanceryTemplate) {
	if (chanceryTemplate === undefined) {
		// create a human
		let p = new Human();
		this.enter(p)
	} else {
		let p = new Bot(chanceryTemplate);
		this.enter(p)
		p.start();
	}

}



Room.prototype.refreshParticipantUI = function() {
	if (this.participantsUI) {
		// Does each participant have a section?
		forKeyIntersection(this.participants, this.participantsUI,
			(key) => {
				// no ui yet
				let p = this.participants[key].p

				let row = createRow({
					holder: this.participantsHolder,
					label: p.id
				})

				row.activity = $("<div/>", {
					class: "activity",
				}).appendTo(row.content)

				row.deleteButton = $("<button/>", {
					html: "🗑",

				}).appendTo(row.controls).click(() => {
					this.exit(p);
				})

				if (p.chancery)
					row.activity.html("(" + p.chancery.title + ")")

				this.participantsUI[key] = row;

			}, (key) => {
				// has ui, ignore
			}, (key) => {
				//  ui but should be removed
				this.participantsUI[key].remove();
			})
	}
}

// Create a new panel of a type
// types: 
// blackboard (show all blackboard data)
// chancery (show chancery data)
// participant
// * chat (chat messages)
// * canvas (processing doodles overdraw)
// * html (jquery shuffle)
//  (* is a channel of communication)



Room.prototype.createChannel = function(type, column, id, data) {
	//console.log("create channel", type, column, id)
	let channel = new channelTypePrototypes[type](id, this, data);
	channel.uiColumn = column;
	// Do a UI?
	if (!this.isHeadless) {
		//console.log("not=headless, create ui")
		channel.createUI(this.columns[channel.uiColumn])
	} else {
		//console.log("create headless channel")
	}

	this.channels[id] = channel;
}

Room.prototype.filterChannels = function(fxn) {
	let keys = Object.keys(this.channels);

	let found = keys.filter((id) => {
		return fxn(id, this.channels[id])
	}).map(id => this.channels[id]);
	return found;
}

Room.prototype.forChannels = function(fxn) {
	Object.keys(this.channels).forEach((id) => fxn(id, this.channels[id]));
}


Room.prototype.enter = function(participant) {
	// this.createPanel("", 0, participant.id, {
	// 	participant: participant
	// })

	let column = 0;
	if (participant.type === "bot")
		column = participant.idNumber % 2;
	//console.log("ENTER: ", participant)
	this.participants[participant.id] = {
		p: participant,
		id: participant.id, // Can be a pseudonym
		controlPanel: this.createChannel("control", column, participant.id + "-control", {
			target: participant
		}),
	}
	this.refreshParticipantUI();

}


Room.prototype.exit = function(participant) {

	delete this.participants[participant.id];
	this.refreshParticipantUI();
}

Room.prototype.getMessage = function(msg) {
	// use the named channel if provided

	let channels = [this.channels[msg.channel]];

	// Fallback, use the default chat, or default of each type
	if (msg.channel === undefined) {
		if (msg.channelType === undefined) {
			// No channel type, assume ... chat?

			channels = [this.channels[defaultChatID]]
		} else {
			// broadcast on all channels of this type? or just the default?
			channels = this.filterChannels((id, c) => {

				return c.type === msg.channelType;
			})
		}
	}



	// Route this message to the appropriate channels (and their listeners)
	channels.forEach(c => {
		c.getMessage(msg);
	})

	// Filter out anyone who sent this message
	let targetPartipants = filterObjectToArray(this.participants, (p, key) => {
		return msg.from !== p && msg.from !== p.id
	});

	// Also send this to the target participants
	if (msg.to !== undefined) {
		let target = msg.to;

		if (typeof target === "string") {
			// Assume ID for the moment,
			// TODO but filter according to class, conditional etc eventually
			targetPartipants = filterObjectToArray(this.participants, (p, key) => {
				return p.id === target;
			})
		} else {
			targetPartipants = [msg.target];
		}



	}

	// Hold an auction for this message
	if (msg.respondable) {
		console.log("\nAuction for msg: " + msgToString(msg))
		// If the message is not multi-use, have everyone bid on it
		let bids = targetPartipants.map(p => p.p.bidOnMessage(msg));

		// Sort by highest bid
		bids.sort(function(a, b) {
			return b.value - a.value
		});

		// remove non-zero bids
		bids = bids.filter(bid => bid.value !== 0)



		// Distribute the message to any participants
		bids.forEach((bid, index) => {
			console.log(" - " + bid.p.id + "(" + bid.ptr.id  + ") bid: " + bid.value)
			bid.isWinner = (index === 0)
			// Was this actually a bid?
			if (bid.p) {
				bid.p.getMsg(msg, bid)
			}
		});
		if (bids.length === 0) {
			console.log("   ... no-one bids on " + msgToString(msg))
		}
	}
}

function msgToString(msg) {
	let s = '"' + msg.msg + '"'
	if (msg.from)
		s += " from " + (msg.from.id || msg.from)
	if (msg.to)
		s += " to " +(msg.to.id || msg.to)
	return s;
}

//======================================