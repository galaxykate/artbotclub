const defaultChatID = "DEFAULT_CHAT"
let participantCount = Math.floor(Math.random());

// A place for bots and humans to chat
// Comes with a default
// Participants: each particpan
function Room() {

	this.participants = {}
	this.channels = {}


	this.createChannel("canvas", 2, "drawing", {});
	this.createChannel("chat", 2, defaultChatID, {});


}

Room.prototype.start = function(chanceryTemplates) {

	// Create a human
	this.createParticipant();

	if (chanceryTemplates)
		chanceryTemplates.forEach(template => {
			//console.log("CREATE BOT FOR TEMPLATE", template)
			this.createParticipant(template);

		})
}

Room.prototype.createParticipant = function(chanceryTemplate, replacing) {
	if (replacing) {
		delete this.participants[replacing.id]
	}
	let controller;
	if (chanceryTemplate === undefined) {
		// create a human
		controller = new Human();
	} else {
		controller = new Bot(chanceryTemplate);

	}

	let pseudonym = controller.id;
	this.participants[pseudonym] = {
		controller: controller,
		id: pseudonym,
		tags: [controller.type],
		idNumber: participantCount++,
		idColor: new KColor((participantCount * 3.92) % 1, 1, .5 + .2 * Math.sin((participantCount * 3.92)))
	}

	controller.start();

	this.do("addParticipant", this.participants[pseudonym], pseudonym, replacing)
	return this.participants[pseudonym];
}


Room.prototype.removeParticipant = function(p) {
	if (p.controller.stop)
		p.controller.stop();
	delete this.participants[p.id]
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
	let channel = new channelTypePrototypes[type](id, this, data);
	this.channels[id] = channel;
	this.do("addChannel", channel, id)
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



Room.prototype.exit = function(id) {
	delete this.participants[id];
	this.do("removeParticipant", participant)
}

Room.prototype.getMessage = function(msg) {
	if (typeof msg.from === "object") {

		let p = filterObjectToArray(this.participants, p => (p.controller === msg.from))
		console.log("FOUND MSG recipient", p)
		if (p.length === 0) {
			console.log(this.participants, msg.from)
		}
		msg.from = p[0].id;
	}


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

	//-----------------------------------------------------------
	// Send the message to the recipient

	let targetPartipants = mapObjectToArray(this.participants.obj, s => s)

	// Filter out anyone who sent this message
	if (msg.from !== undefined) {
		if (typeof msg.from === "string") {
			targetPartipants = filterObjectToArray(this.participants, (p, key) => {
				return msg.from !== p.id
			});
		} else {
			console.warn("MSG has a non-string from-address!", msg)
		}
	}

	// Also send this to the target participants
	if (msg.to !== undefined) {
		if (typeof msg.to === "string") {
			targetPartipants.filter(p => matchesSelector(msg.to, p));
		} else {
			console.warn("MSG has a non-string addressee!", msg)
		}
	}

	// Hold an auction for this message
	if (msg.respondable) {
		//console.log("\nAuction for msg: " + msgToString(msg))
		// If the message is not multi-use, have everyone bid on it
		let bids = targetPartipants.map(p => {
			let v = 0;
			if (p.controller.bidOnMessage) {
				let bid = p.controller.bidOnMessage(msg)
				bid.participant = p;
				return bid;
			}
			return {
				participant: p,
				value: 0
			}

		});

		// Sort by highest bid
		bids.sort(function(a, b) {
			return b.value - a.value
		});

		// remove non-zero bids
		bids = bids.filter(bid => bid.value !== 0)

		// Distribute the message to any participants
		bids.forEach((bid, index) => {
			//console.log(" - " + bid.p.id + "(" + bid.ptr.id + ") bid: " + bid.value)
			bid.isWinner = (index === 0)
			// Was this actually a bid?
			if (bid.p) {
				bid.p.getMsg(msg, bid)
			}
		});
		if (bids.length === 0) {
			//console.log("   ... no-one bids on " + msgToString(msg))
		}
	}
}

function matchesSelector(selector, candidate) {
	// Select by class
	if (selector.startsWith(".")) {
		return candidate.tags && candidate.tags.indexOf(select.substring(1));
	}
	// Select by id
	return candidate.id === selector
}
Room.prototype.on = addEventHandler;
Room.prototype.do = doEventHandlers;


//=========
function msgToString(msg) {
	let s = '"' + msg.msg + '"'
	if (msg.from)
		s += " from " + (msg.from.id || msg.from)
	if (msg.to)
		s += " to " + (msg.to.id || msg.to)
	return s;
}

//======================================