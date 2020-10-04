// Create a chancery map (like tracery, raw maps and raw grammars arent modified)

let chanceryCount = 0;

let tuning = {
	minimumStageTime: 100,
	exitDelay: 100,
	actionDelay: 100,
	exitStageNames: ["selected", "entered", "cooldown"],
	requireUserActionToExit: false,
}

function Blackboard() {
	this.bb = {
		test: "FOOBAR",
		foo: 1,
		x: Math.random(),
		y: 1,
		z: 2,
		drinkname: "water",
		drinkdesc: "its water",
		bar: true
	}
}
Blackboard.prototype.getAtPath = function(path) {
	//console.log("BB: get at path", path)

	return this.bb[path[0]]
}

Blackboard.prototype.setAtPath = function(path, val) {
	this.bb[path[0]] = val;
}

function Chancery(template) {

	this.template = parseChanceryMap(template);

	this.idNumber = chanceryCount++;
	this.time = {
		start: Date.now(),
		elapsed: 0,
		current: 0,
		updateCount: 0
	}
	if (this.template.id === undefined) {
		console.warn("no id in template");
	}
	this.id = this.template.id + this.idNumber;
	this.title = this.template.title;


	// Parse the map maybe
	this.maps = [new Map(this, "main", this.template)]
	this.blackboard = new Blackboard();

}

Chancery.prototype.start = function() {
	console.log("START CHANCERY", this.title)

	this.maps.forEach(map => {
		map.createPointer("c" + this.idNumber + "-main");
	});
}

Chancery.prototype.getAtPath = function(path) {
	return this.blackboard.getAtPath(path);
}

Chancery.prototype.setAtPath = function(path, val) {
	return this.blackboard.setAtPath(path, val);
}


Chancery.prototype.update = function() {

	this.time.current = Date.now() - this.time.start;

	this.time.updateCount++;

	if (this.time.updateCount % 10 === this.idNumber % 10) {
		//this.output("Update Chancery" + this.idNumber + ": " + this.time.current);
		//	console.log("update", this.time.updateCount, this.time.current)
	}

	this.maps.forEach(map => map.update());


}
Chancery.prototype.output = function(msg, isMainVoice, ptr) {
	// Call the output handler
	this.do("say", {
		msg: msg,
		isDebugOutput: !isMainVoice,
		useVoice: isMainVoice,
		respondable: isMainVoice,
	})
}

Chancery.prototype.input = function(msg, bid) {
	this.output("[" + this.id + "]: received '" + msg.msg + "'")


	if (bid !== undefined) {

		// Fulfill any exit condition of the pointer that won the bid
		bid.ptr.getBidInput(msg, bid);


	} else {
		console.log("non-bid msg:" + msg.msg)
	}



	if (msg.msg === "talk")
		this.output("hey");
	//this.output("<- heard " + msg.msg + " from " + msg.from);
}

// How much does this want to bid on the message?
Chancery.prototype.bidOnMessage = function(msg) {
	let highBid = {
		value: 0
	};
	this.maps.forEach(map => {
		map.pointers.forEach(ptr => {
			let bid = ptr.bidOnMessage(msg);


			if (bid.value > highBid.value) {
				//console.log("best bid: " + bid.value)
				highBid = bid;
			}
		});
	});

	return highBid

}

Chancery.prototype.on = addEventHandler;
Chancery.prototype.do = doEventHandlers;


//===========================================

function Map(chancery, id, rawMap) {
	this.states = rawMap.states;
	this.pointers = [];
	this.chancery = chancery;

	this.filters = {}


	this.grammar = new TraceryGrammar(rawMap.grammar);

}

Map.prototype.getExitActions = function(tags) {
	// Get the actions for entering this set of tags
	let actions = []
	for (var i = 0; i < tags.length; i++) {
		let filter = this.filters[tag[i]]
		if (filter) {
			actions = actions.concat(filter.onExit);
		}
	}
	return actions
}
Map.prototype.getEnterActions = function(tags) {
	// Get the actions for entering this set of tags
	let actions = []
	for (var i = 0; i < tags.length; i++) {
		let filter = this.filters[tag[i]]
		if (filter) {
			actions = actions.concat(filter.onEnter);
		}
	}
	return actions
}

Map.prototype.update = function() {

	$.each(this.pointers, (index, ptr) => {
		ptr.update();
	});
}

Map.prototype.createPointer = function(id, startState) {
	startState = startState ? startState : "origin";
	let p = new Pointer(id, this);

	p.grammarContext = this.grammar.createContext({
		blackboard: this.chancery.blackboard,
		modifiers: this.chancery.template.modifiers
	});


	this.pointers.push(p);
	this.chancery.do("createPointer", p)
}


function getSelectorMatches(selector, array) {
	// TAGS
	if (selector.startsWith(".")) {
		let tags = selector.split(".").slice(1);
		return array.filter((s) => {
			if (s.tags === undefined)
				return false;
			for (var i = 0; i < tags.length; i++) {
				if (s.tags.indexOf(tags[i]) < 0)
					return false;
			}
			return true;
		})
	}

	// ID
	return array.filter((s) => s.id === selector)
}