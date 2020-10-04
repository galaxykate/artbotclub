//====================================================

let humanCount = 0;

function Human() {
	this.idNumber = humanCount++;
	this.type = "human";

	this.id = "Human" + this.idNumber;


	setInterval(() => {
		if (!paused) {
			if (Math.random() > .9) {

				// this.do("say", {
				// 	from: this.id,
				// 	msg: "*",
				// 	to: getRandom(chat.participants.filter(p => p.isBot)).id
				// });
			}
		}
	}, 300 + 100 * Math.random())

}


Human.prototype.start = function() {
	setTimeout(() => {
		room.getMessage({
			from: this,
			msg: "hi, i am " + this.id + "\ni'm a human"
		})

	}, Math.random() * 100 + 1000)
}


Human.prototype.bidOnMessage = function(msg) {
	return {
		value: 0
	};
}


Human.prototype.createUI = function(card) {

	// Say stuff
	let human = this;

	let chat = $("<input/>").appendTo(card.content).val("the #color# #animal# went to #place#").keyup((e) => {
		var code = (e.keyCode ? e.keyCode : e.which);
		if (code == 13) { //Enter keycode
			sendMsg();
			chat.val("")
		}
	})

	let everyoneLabel = "-everyone-"

	let grammar = new TraceryGrammar({
		color: ["magenta", "silver", "ecru", "red", "turquoise", "purple", "green", "grey", "blue", "beige", "crimson", "periwinkle", "orange"],
		animal: ["cat", "dog", "lemur", "alpaca", "corgi", "zebra", "leopard", "cougar", "cobra", "unicorn", "dragon", "llama", "hamster", "elephant"],
		place: ["Burningman", "the beach", "Santa Cruz", "lower Manhattan", "the moon", "the library"],
		story: ["the #color# #animal# went to #place#"]
	})

	// Send a message via chat
	let to = selectWidget({
		holder: card.content,
		label: "to:",
		ids: [everyoneLabel].concat(Object.keys(room.participants)),
		onSelect: (id) => {
			sendMsg();
		},
		getLabel: (id) => {
			return id;
		}
	});

	function sendMsg() {
		let target = to.find('option:selected').text();
		console.log("say '" + chat.val() + "' to " + target);
		if (target === everyoneLabel)
			target = undefined
		room.getMessage({
			from: human,
			msg: grammar.flatten(chat.val()),
			channelType: "chat",
			to: target,
			respondable: true,
		});
	}

	// Drawing tools
}

Human.prototype.toString = function() {
	return this.id;
}

Human.prototype.getMsg = function(msg, isBidWinner) {
	//console.log(this + ": got message", msg, "bidWinner=" + isBidWinner)
}