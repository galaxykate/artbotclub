// Create a chancery map (like tracery, raw maps and raw grammars arent modified)

let chanceryCount = 0;

let tuning = {
	exitDelay: 1200
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
	console.log("BB: set at path", path, val)
	this.bb[path[0]] = val;
}

function Chancery(baseMap) {

	baseMap = parseChanceryMap(baseMap);

	this.idNumber = chanceryCount++;
	this.time = {
		start: Date.now(),
		elapsed: 0,
		current: 0,
		updateCount: 0
	}
	if (baseMap.id === undefined) {
		console.warn("no id in base map");
	}
	this.id = baseMap.id + this.idNumber;
	this.title = baseMap.title;
	this.baseMap = baseMap;
	// Parse the map maybe
	this.maps = [new Map(this, "main", baseMap)]
	this.blackboard = new Blackboard();

}

Chancery.prototype.start = function() {

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
	console.log(msg)
	this.output("[" + this.title + "]: received '" + msg.msg + "'")


	if (bid !== undefined) {
		console.log(bid)
		console.log(this.title + " won '" + msg.msg + "' for $" + bid.value)

		// Fulfill any exit condition of the pointer that won the bid
		bid.ptr.exitMap.forEach(exitWatcher => {

			exitWatcher.conditionMap.forEach(cw => {
				if (cw.condition.type === "say") {
					let targetPhrase = bid.ptr.getValue(cw.condition);
					let bidVal = getMatchBid(targetPhrase, msg.msg)
					console.log("MATCH VAL: " + bidVal)
					if (bidVal > 0) {
						cw.hasMatch = true;
						cw.matchValue = bidVal
					}
				}
			})
		})

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

	this.grammar = new TraceryGrammar(rawMap.grammar);

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
		blackboard: this.chancery.blackboard
	});


	this.pointers.push(p);
	this.chancery.do("createPointer", p)
	p.enterState(startState);


}