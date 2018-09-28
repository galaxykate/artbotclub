//===========================================
let pointerCount = 0;

function Pointer(id, map) {
	this.allowExit = true;
	this.id = id;
	this.idNumber = pointerCount++;
	this.map = map;
	this.chancery = this.map.chancery;
	this.time = {
		enterState: 0,
		inState: 0,
		start: this.chancery.time.current,
		age: 0
	}
	this.exitMap = [];

}

Pointer.prototype.enterState = function(id) {


	this.time.enterState = this.chancery.time.current;
	let lastState = this.state;

	if (this.map.states[id] === undefined)
		console.warn("No state '" + id + "' in ", this.map);
	else {
		this.state = this.map.states[id];



		// Set up the exit map

		let stateID = this.state.id;

		function createExitWatcher(exit, label) {
			return {
				label: label,
				isEntered: false,
				isOpen: false,
				conditionMap: exit.conditions.map(c => {
					return {

						pct: 0,
						condition: c,
						isMet: false
					}
				}),
				exit: exit,
			}
		}
		this.exitMap = this.state.exits.map((exit, index) => {
			if (exit === undefined)
				console.warn("Undefined exit in state:", this.exitMap)
			return createExitWatcher(exit, stateID + "-ex" + index)
		})


		this.do("enterState", lastState)
		this.chancery.do("enterState", this, lastState)

		// if (lastState)
		// 	console.log("move ptr: " + this.id + " " + lastState.id + " -> " + this.state.id)
		// else
		// 	console.log("move ptr: " + this.id + "-> " + this.state.id)

	}
}


Pointer.prototype.update = function() {
	this.time.inState = this.chancery.time.current - this.time.enterState;
	this.time.age = this.chancery.time.current - this.time.start;

	// Update the exit map

	// Update each exit
	// If it has changed, alert the pointer and chancery handlers
	this.exitMap.forEach((exit, exitIndex) => {
		let t = this.time.inState;
		let openAmt = 0;

		let changed = false;
		let conditionsChanged = []
		exit.conditionMap.forEach((c, index) => {
			let lastPct = c.pct
			// Update this condition (pct full, open, etc)
			switch (c.condition.type) {
				case "wait":
					c.pct = Math.min(1, t / (1000 * this.getValue(c.condition.value)));

					break;
				case "say":
					// TODO 
					c.pct = c.hasMatch ? 1 : 0;
					//c.pct = Math.min(1, .8 + 3 * utilities.noise(exitIndex + index + .0008 * t));
					break;
				default:
					c.pct = Math.min(1, .8 + 3 * utilities.noise(exitIndex + index + .0002 * this.time.age));


			}


			// Set the new value
			const newVal = c.pct >= 1;
			if (newVal !== c.isMet || lastPct !== c.pct) {
				changed = true;
				conditionsChanged.push(index);

			}
			c.isMet = newVal;

			openAmt += c.pct;
		})


		if (exit.conditionMap.length === 0) {
			exit.openPct = 1;
		} else
			exit.openPct = openAmt / exit.conditionMap.length;
		let newOpen = exit.openPct >= 1;

		if (newOpen !== exit.isOpen)
			changed = true;

		exit.isOpen = newOpen;

		// Alert
		if (changed) {
			this.do("updateExitMap", exit, exitIndex, conditionsChanged);
			this.chancery.do("updateExitMap", this, exit, exitIndex, conditionsChanged);

		}


	})

	if (this.selectedExit === undefined) {
		let openExits = this.exitMap.filter(e => e.isOpen);
		if (openExits.length > 0) {

			this.selectExit(openExits[0])
		}
	}

	if (this.selectedExit !== undefined) {
		let t = this.chancery.time.current - this.exitCountdownStart;
		if (t > tuning.exitDelay) {
			if (this.allowExit)
				this.activateExit();
		}
	}



	//console.log("update " + this.id, this.time.inState);

}

// Get a tracery rule from.... somewhere
Pointer.prototype.getRule = function(val) {
	console.log(val)
	if (val.type === "traceryRule") {
		return val.value;
	} else {
		console.warn("Unknown value type:", val)
	}
}
// Get a tracery rule from.... somewhere
Pointer.prototype.getValue = function(obj) {

	switch (obj.type) {
		case "wait":
			return this.getValue(obj.value);
		case "number":
			return obj.value;
		case "key":
			// TODO dynamic keys
			return obj.value;
		case "say":
			return this.getValue(obj.value);
		case "traceryRule":
			return obj.value
		case "path":
			let path = obj.sections.map(s => this.getValue(s));

			return this.getAtPath(path)
		case "expression":
			// TODO calculate an actual expression
			let start = 0;
			let invert = false;
			let negate = false;

			let val;
			let lastOp;
			for (var i = 0; i < obj.sections.length; i++) {
				let s = obj.sections[i];
				if (s.type === "op") {
					if (lastOp) {
						console.log("DOUBLE OP!", lastOp, s.value)
					}
					lastOp = s.value;
				} else {
					let v = this.getValue(s);

					if (val === undefined)
						val = v
					else {
						switch (lastOp) {
							case "*":
								val *= v;
								break;
							case "/":
								val /= v;
								break;
							case "+":
								val += v;
								break;
							case "-":
								val -= v;
								break;
							case "^":
								val = Math.pow(val, v);
								break;
							case "%":
								val %= v;
								break;
							default:
								if (lastOp == undefined)
									console.warn("Two values with no operator ", s)
								else
									console.warn("Unknown/unimplemented operation: ", lastOp)
						}

						lastOp = undefined;
					}
					return val

				}
			}
			return 47
		default:
			console.warn("unknown value type: ", obj)
			return 0;
	}


}

Pointer.prototype.getAtPath = function(path) {
	return this.chancery.getAtPath(path);
}



Pointer.prototype.setAtPath = function(path, value) {
	this.chancery.setAtPath(path, value);
}

Pointer.prototype.bidOnMessage = function(msg) {
	// which exits could use this message?

	let maxValue = 0;
	let bestExit;
	let conditionIndex;
	this.exitMap.forEach((exit, exitIndex) => {
		exit.currentBid = undefined
		exit.conditionMap.forEach((conditionWatcher, condIndex) => {
			let c = conditionWatcher.condition;

			// TODO does this message match the type?
			if (c.type === "say") {

				let rule = this.getValue(c);
				console.log("RULE", rule, "MSG", msg.msg)
				let value = getMatchBid(rule, msg.msg)
				// TODO modulate based on % fulfillment, "wait"ing exits are deprioritized

				if (value > maxValue) {
					maxValue = value
					bestExit = exit;
				}
				conditionIndex = condIndex;

				exit.currentBid = value;
			}
		})

		this.do("setBid", exit, exitIndex);
	})
	return {
		ptr: this,
		value: maxValue,
		exit: bestExit,
		conditionIndex: conditionIndex
	};
}


Pointer.prototype.selectExit = function(exit) {
	this.selectedExit = exit;
	this.do("selectExit", exit);
	this.chancery.do("selectExit", this);
	this.exitCountdownStart = this.chancery.time.current;
}


Pointer.prototype.activateExit = function() {

	this.do("activateExit", this.selectedExit);
	this.chancery.do("activateExit", this);

	// Get the value of the exit
	let targetID = this.getValue(this.selectedExit.exit.target);


	// Do all the exit actions
	this.selectedExit.exit.actions.forEach(action => {
		switch (action.type) {
			case "say":
				// Generate something to say
				let rule = this.getValue(action)
				let msg = utilities.capitaliseFirstLetter(this.grammarContext.flatten(rule))
				this.chancery.output(msg, true, this);
				break;
			case "expression":
				console.log(action.raw);
				// there should only be 2 or three
				if (action.sections.length === 3) {
					let op = action.sections[1].value;

					// get the path
					let targetPath = action.sections[0].sections.map(s => this.getValue(s));
					let v0 = this.getAtPath(targetPath);
					let v1 = this.getValue(action.sections[2])

					// Process any tracery strings
					if(typeof v1 === "string") {
						v1 = this.grammarContext.flatten(v1);
						console.log(v1)
					}
					console.log(targetPath, v0, v1)
					switch (op) {
						case "=": break;
					}
				} else if (action.sections.length === 2) {
					let op = action.sections[1].value;
				} else {
					console.log("Unimplemented expression setup (more than 1 op!)", action.section)
				}

				break;
			default:
				console.warn("unknown action type", action);
		}


	})
	this.enterState(targetID);

	this.selectedExit = undefined;

}


Pointer.prototype.on = addEventHandler;
Pointer.prototype.do = doEventHandlers;


function getMatchBid(pattern, sample) {
	let found = sample.toLowerCase().indexOf(pattern.toLowerCase())

	if (found >= 0)
		return pattern.length / sample.length;
	return 0;
}