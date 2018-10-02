//====================================================
let botCount = 1;

function Bot(chanceryTemplate) {
	if (typeof chanceryTemplate !== "object") {
		console.warn("Non-existent chanceryTemplate!", chanceryTemplate)
		return;
	}
	
	this.idNumber = botCount++;
	this.type = "bot";
	if (chanceryTemplate.voice)
		this.voice = chanceryTemplate.voice

	//let voices = ["Icelandic Male", "Spanish Female", "UK English Female", "UK English Male", "US English Male", "US English Female"]
	// let voices = ["UK English Female", "UK English Male", "US English Female"]
	// this.voice = {
	// 	letterSpeed: 3,
	// voiceType "UK English Female"
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

	this.id = this.chancery.id + "";



}



Bot.prototype.start = function() {
	room.getMessage({
		from: this,
		useVoice: true,
		msg: "hi, i am " + this.id
	})

	room.getMessage({
		from: this.id,
		isDebugOutput: true,
		msg: "i'm playing '" + this.chancery.title + "'"
	})

	this.chancery.start();

	this.updateInterval = setInterval(() => {
		if (!paused) {
			this.chancery.update()
		}
	}, 50);

}

Bot.prototype.stop = function() {
	clearInterval(this.updateInterval);
}


// Create the UI for this bot
Bot.prototype.createUI = function(card) {
	console.log("CREATE UI")
	// Mini status bar
	card.status = new ChanceryUIMini(card.content, this.chancery)

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
			console.log("   Auction won, " + this.id + " " + msg.msg, "Matches: ", bid.matches)
			this.chancery.input(msg, bid);
		}
	} else {
		//this.chancery.input(msg);
	}
}