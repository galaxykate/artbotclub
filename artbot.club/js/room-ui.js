// UI to control and show what goes on in room
function RoomUI(mainHolder, overlayHolder, room, columnCount) {
	this.room = room;
	this.cards = {}
	this.columns = []



	this.overlayBG = $("<div>", {
		class: "overlay-bg"
	}).appendTo(overlayHolder).click(() => {
		this.overlayBG.hide();
	}).hide();
	this.overlayCenter = $("<div>", {
		class: "overlay-center"
	}).appendTo(this.overlayBG);

	this.overlayCard = createCard({
		holder: this.overlayCenter,
		title: "test",
		classes: "overlay"
	}).click(() => false)



	// Create columns
	this.columnCount = columnCount;
	let columnHolder = $("<div/>", {
		class: "column-holder"
	}).appendTo(mainHolder);
	for (var i = 0; i < this.columnCount; i++) {
		this.columns[i] = $("<div/>", {
			class: "column"
		}).appendTo(columnHolder)
	}


	// Create the controlUI 
	this.addCard(0, "controls", "Room");
	// Create the chancery-adding widget
	this.addParticipantWidget = selectWidget({
		holder: this.cards.controls.content,
		label: "add:",
		goLabel: "+",
		ids: ["human"].concat(Object.keys(localChanceries)),
		onSelect: (id) => {
			this.room.createParticipant(localChanceries[id]);
		},
		getLabel: (id) => {
			if (testChanceries[id])
				return testChanceries[id].title
			return id
		}
	});


	// Create UI for all the channels
	this.room.on("addChannel", (channel, id) => {
		console.log("Room has added a channel");
		this.addChannelUI(channel);
	})

	// Create UI for all the channels
	this.room.on("addParticipant", (participant, id, replacing) => {
		console.log("Room has added a participant", id);
		this.addParticipantUI(participant, replacing);
	})

	// Create UI for all the channels
	this.room.on("removeParticipant", (participant, id) => {
		console.log("Room has removed a participant", id);

		if (participant.controller)
			participant.controller.stop();
		this.cards.remove("participant-" + id);
		this.cards[id].reset();
	})

	// For existing channels and participants, create the necessary cards
	mapObject(this.room.channels, c => this.addChannelUI(c))
	mapObject(this.room.participants, p => this.addParticipantUI(p))
}

RoomUI.prototype.addChannelUI = function(channel) {
	let card = this.addCard(2, "channel-" + channel.id, channel.id);
	channel.createUI(card)
}


RoomUI.prototype.addParticipantUI = function(p, replacing) {
	console.log("ADD PARTICIPANT", p, "REPLACING", replacing)

	let cardID = "participant-" + p.id
	let card;
	if (!replacing)
		card = this.addCard(1, cardID, p.id);
	else {
		let replacingCardID = "participant-" + replacing.id
		
		if (replacing.controller)
			replacing.controller.stop();

		card = this.cards[replacingCardID];
		card.reset();
		card.title.html(p.id)
		this.cards[cardID] = card;
		delete this.cards[replacingCardID];

	}

	card.header.css({
		backgroundColor: p.idColor.toCSS(.1),
		color: p.idColor.toCSS(-.9)
	})

	// Selector
	selectWidget({
		holder: card.controls,
		default: p.controller.type,
		ids: ["", "human"].concat(Object.keys(localChanceries)),

		onSelect: (id) => {
			card.reset();

			this.room.createParticipant(localChanceries[id], p)
		},
		getLabel: (id) => {
			return id
		}
	});

	p.controller.createUI(card);



	if (p.controller.type === "bot") {
		// card.popout = $("<button/>").appendTo(card.controls).click(() => {
		// 	this.overlayBG.show();
		// 	this.overlayCard.content.html("");
		// 	let view = ChanceryView(this.overlayCard.content, p.controller.chancery.template);
		// })

		card.popout = $("<button/>", {
			html: "x"
		}).appendTo(card.controls).click(() => {
			this.room.removeParticipant(p)
			
			delete this.cards[p.id]
			card.remove();
		})
		card.dblclick(() => {
			this.overlayBG.show();
			this.overlayCard.content.html("");
			let view = ChanceryView(this.overlayCard.content, p.controller.chancery.template);

		})
	}

}

RoomUI.prototype.addCard = function(columnIndex, id, title) {
	let c = createCard({
		title: title,
		holder: this.columns[columnIndex]
	});
	this.cards[id] = c;
	return c;
}

function setToChiclet(div, participant) {
	// Make this div
	div.addClass("chiclet");
	div.html(participant.id)
	div.css({

		backgroundColor: participant.idColor.toCSS(.1),
		color: participant.idColor.toCSS(-.9)
	})
}

// Room.prototype.refreshParticipantUI = function() {
// 	if (this.participantsUI) {
// 		// Does each participant have a section?
// 		forKeyIntersection(this.participants, this.participantsUI,
// 			(key) => {
// 				// no ui yet
// 				let p = this.participants[key].p

// 				let row = createRow({
// 					holder: this.participantsHolder,
// 					label: p.id
// 				})

// 				row.activity = $("<div/>", {
// 					class: "activity",
// 				}).appendTo(row.content)

// 				row.deleteButton = $("<button/>", {
// 					html: "🗑",

// 				}).appendTo(row.controls).click(() => {
// 					this.exit(p);
// 				})

// 				if (p.chancery)
// 					row.activity.html("(" + p.chancery.title + ")")

// 				this.participantsUI[key] = row;

// 			}, (key) => {
// 				// has ui, ignore
// 			}, (key) => {
// 				//  ui but should be removed
// 				this.participantsUI[key].remove();
// 			})
// 	}
// }

// Room.prototype.setToChiclet = function(div, participant) {
// 	// Make this div
// 	div.addClass("chiclet");
// 	div.html(participant.id)
// 	div.css({
// 		color: participant.idColor.toCSS(-.4),
// 		backgroundColor: participant.idColor.toCSS(.4)
// 	})

// }



// Room.prototype.createUI = function(holder) {



// 	this.participantsHolder = $("<div/>", {

// 	}).appendTo(this.controlCard.content);
// 	this.participantsUI = {

// 	}
// 	this.refreshParticipantUI();

// 	this.forChannels((key, channel) => {

// 		channel.createUI(this.columns[channel.uiColumn])
// 	})
// }