//====================================================
let botCount = 1;

function Bot(chanceryTemplate) {
	this.idNumber = botCount++;
	this.id = "Bot" + this.idNumber;
	this.idColor = new KColor(this.idNumber * .221, 1, .5);
	this.type = "bot";

	//let voices = ["Icelandic Male", "Spanish Female", "UK English Female", "UK English Male", "US English Male", "US English Female"]
	// let voices = ["UK English Female", "UK English Male", "US English Female"]
	// this.voice = {
	// 	letterSpeed: 3,
	// 	voiceType: getRandom(["UK", "US"]) + " English " + getRandom(["Male", "Female"])
	// }
	// this.voice.voiceType = voices[this.idNumber%4]


	// Pick out a chancery map

	
	this.chancery = new Chancery(chanceryTemplate);
	// console.log(this.chancery)
	this.chancery.on("say", (msg) => {
		msg.from = this.id
		msg.channelType = "chat"
		room.getMessage(msg);
	})

	this.id = this.chancery.id;

	setTimeout(() => {
		room.getMessage({
			from: this.id,
			useVoice: true,
			msg: "hi, i am " + this.id
		})

		room.getMessage({
			from: this.id,
			isDebugOutput: true,
			msg: "i'm playing '" + this.chancery.title + "'"
		})

	}, Math.random() * 100 + 1000)

	setInterval(() => {
		//if (!paused) {

		this.chancery.update()
		//}
	}, 100);



}



Bot.prototype.start = function() {
	this.chancery.start();
}


Bot.prototype.createControls = function(holder) {
	// Dropdown for chanceries

	let view = new ChanceryView(holder, this.chancery.baseMap)


	// Pointer ui
	// this.ptrHolder = createSection({
	// 	holder: holder,
	// 	title: "pointers:"
	// })

	// this.chancery.maps.forEach(map => {

	// 	// create ptrs
	// 	map.pointers.forEach((ptr) => {
	// 		let ptrcontrol = new ChanceryPointerUI(this.ptrHolder.content, ptr)
	// 	});

	// });
	// this.chancery.on("createPointer", (ptr) => {
	// 	new ChanceryPointerUI(this.ptrHolder.content, ptr)
	// });
}

// Create the UI for this bot
Bot.prototype.createUI = function(holder) {
	let card = createCard({
		title: this.getStyledID(),
		classes: "chatparticipant-card"
	});

	card.appendTo(holder)

	let inputButton = ["talk", "move"].map(type => {
		return $("<button/>", {
			html: type
		}).appendTo(card.controls).click(() => {
			this.chancery.input({
				msg: type
			});
		});
	})



	card.chancery = $("<div/>", {
		class: "card-chancery"
	}).appendTo(card.content);

	this.ui = new ChanceryUI(card.chancery, this.chancery);

	card.click(() => this.do("select"));

	this.on("select", () => {
		// Close all other cards
		$(".card-detail").hide()
		$(".chatparticipant-card").removeClass("card-selected")
		card.addClass("card-selected")
		card.find(".card-detail").show();
	})
}

Bot.prototype.toString = function() {
	return this.id;
}

// Who wants this message?
Bot.prototype.bidOnMessage = function(msg) {
	let bid = this.chancery.bidOnMessage(msg);
	bid.p = this;
	return bid;
}

Bot.prototype.getMsg = function(msg, bid) {
	// This message was bought at auction
	if (bid) {
		if (bid.isWinner) {
			console.log("auction won, " + this.id + " " + msg.msg)
			this.chancery.input(msg, bid);
		}
	} else {
		//this.chancery.input(msg);
	}
}