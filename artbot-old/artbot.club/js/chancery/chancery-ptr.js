//===========================================
let pointerCount = 0;

let pointerStatusLabels = ["enter state", "do state+tag enter actions", "update", "enter exit", "do exit actions", "do state+tag exit actions", ]

function Pointer(id, map) {
	this.allowExit = true;
	this.id = id;
	this.idNumber = pointerCount++;
	this.map = map;
	this.stateHistory = [];
	this.chancery = this.map.chancery;
	this.time = {
		enterState: 0,
		inState: 0,
		inStatus: 0,
		startStatus: this.chancery.time.current,
		start: this.chancery.time.current,
		age: 0
	}



	this.enterTags = [];
	this.exitTags = [];
	this.status = 0;
	this.exitMap = [];
	this.targetID = "origin";
	this.enterStatus();

}

Pointer.prototype.getSpeechSpeed = function() {
	return 9;
}

// Set the time to do these actions
Pointer.prototype.processActions = function(actionTemplates) {
	this.actions = actionTemplates.map(template => {
		let action = {
			template: template,
			raw: template.raw,
			type: template.type,
			time: 0,
		}


		switch (template.type) {
			case "say":
				action.rule = this.getValue(template.value);
				action.value = this.grammarContext.flatten(action.rule);
				action.time = action.value.length * this.getSpeechSpeed();
				break;
			case "expression":
				action.targetPath = template.sections[0].sections.map(s => this.getValue(s));
				action.op = template.sections[1].raw
				action.value = this.getValue(template.sections[2])
				break;
			case "wait":
				action.time = this.getValue(template.value);
				break;
			default:
				console.warn("unknown action type: ", template.type);
		}



		return action;
	})


	for (var i = 0; i < this.actions.length; i++) {
		this.doAction(this.actions[i])
	}
	this.time.statusTimeLimit = Math.max(this.actions.reduce((a, v) => v.time + a, 0), tuning.minimumStageTime);


	this.time.statusTimeLimit += tuning.actionDelay;
}


Pointer.prototype.refreshExitWatchers = function() {



	let stateID = this.state.id

	function createExitWatcher(exit, label) {
		return {
			id: label,
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
}


Pointer.prototype.enterStatus = function() {
	let actions;
	this.time.startStatus = this.chancery.time.current;
	this.time.statusTimeLimit = 100;

	switch (this.status) {
		case 0: // enter state

			// Clear the active exit
			this.activeExit = undefined;

			let lastState = this.state;
			this.stateHistory.push(lastState)

			// Set the enter time
			this.time.enterState = this.chancery.time.current;
			// Set the state
			this.state = this.map.states[this.targetID];
			if (this.state === undefined)
				console.warn("No state named '" + this.targetID + "'")

			// set the exitmap
			this.refreshExitWatchers();

			this.do("enterState", lastState, lastState !== this.state)
			this.chancery.do("enterState", this, lastState, lastState !== this.state)



			break;
		case 1: // do state+tag enter actions
			actions = this.state.onEnter.concat(this.map.getEnterActions(this.enterTags))
			this.processActions(actions);

			break;
		case 2: // update

			this.time.statusTimeLimit = undefined
			break;
		case 3: // enter exit

			if (this.activeExit) {
				let target = this.getValue(this.activeExit.exit.target)
				this.targetID = this.getTargetID(target);
				// Set the enter and exit tags
				this.enterTags = [];
				this.exitTags = [];
				this.skipActions = false;

				// Undefined id?
				//   go back to this, but skip the state/tag actions
				if (this.targetID === undefined) {
					console.warn("undefined exit:", target);
					this.skipExits = true;
					this.targetID = this.state.id;
				}
			} else
				console.warn("In exit stage with no exit!")
			break;
		case 4: // do exit actions
			if (this.activeExit)
				this.processActions(this.activeExit.exit.actions);
			else
				console.warn("In exit stage with no exit!")

			break;
		case 5: // do state+tag exit actions
			actions = this.state.onExit.concat(this.map.getExitActions(this.exitTags));
			this.processActions(actions);
			break;
	}

	this.do("enterStatus");

	this.update();
}


// Go to the next status
Pointer.prototype.exitStatus = function() {
	this.do("exitStatus");
	// Enter the next status
	this.status = (this.status + 1) % pointerStatusLabels.length;
	this.enterStatus();
}

Pointer.prototype.updateExitMap = function() {
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
					// TODO Use bid values?
					c.pct = c.hasMatch ? 1 : 0;
					//c.pct = Math.min(1, .8 + 3 * utilities.noise(exitIndex + index + .0008 * t));
					break;

				case "expression":
					let sections = c.condition.sections
					//let rhs = this.getValue(c.condition.value)
					if (sections.length === 3) {
						let lhs = this.getValue(sections[0])
						let op = sections[1].value;
						let rhs = this.getValue(sections[2])
						let value = false;
						switch (op) {
							case "==":
								value = (lhs == rhs);
								break;
							case "!=":
								value = (lhs != rhs);
								break;
							case "<=":
								value = (lhs <= rhs);
								break;
							case ">=":
								value = (lhs >= rhs);
							case ">":
								value = (lhs > rhs);
								break;
							case "<":
								value = (lhs < rhs);
								break;
							default:
								console.warn("unimplemented conditional expression operator: ", op);
						}
						c.pct = 0;
						if (value)
							c.pct = 1;
					//	console.log(lhs, op, rhs, value, c.pct)
					} else {
						console.warn("Weird conditional expression, should have only 3 sections!", c.condition)
						c.pct = 0;
					}
					// TODO Use bid values?
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
			this.do("updateExit", exit, exitIndex, conditionsChanged);
		}


	})



}

Pointer.prototype.update = function() {
	let t = this.chancery.time.current;
	this.time.inState = t - this.time.enterState;
	this.time.age = t - this.time.start;
	this.time.inStatus = t - this.time.startStatus;


	if (this.time.statusTimeLimit !== undefined) {
		let statusPct = this.time.inStatus / this.time.statusTimeLimit
		if (statusPct > 1) {
			// Time out this limit
			this.exitStatus();

		} else {
			this.do("updateStatusPct", statusPct)
		}
	}


	switch (this.status) {
		case 0: // enter state
			break;
		case 1: // do state+tag enter actions
			break;
		case 2: // update
			this.updateExitMap();
			this.openExits = this.exitMap.filter(ex => ex.isOpen);

			if (this.time.inStatus > tuning.minimumStageTime) {
				// Activate the first exit
				if (this.openExits.length > 0) {
					let exit = this.openExits[0].exit;
					if (!this.activeExit || this.activeExit.exit !== exit) {
						this.activeExit = {
							exit: exit,
							targetID: this.getValue(exit.target)
						}
						this.do("selectExit");
						if (!tuning.requireUserActionToExit)
							//this.exitStatus();
							this.time.statusTimeLimit = this.time.inStatus + tuning.exitDelay;
						else {

						}
					}
				}
			}
			break;
		case 3: // enter exit
			break;
		case 4: // do exit actions
			break;
		case 5: // do state+tag exit actions
			break;
	}

}

// Get a tracery rule from.... somewhere
Pointer.prototype.getRule = function(val) {
	if (val.type === "traceryRule") {
		return val.value;
	} else {
		console.warn("Unknown value type:", val)
	}
}
// Given a target selector, figure out what its pointing to
Pointer.prototype.getTargetID = function(selector) {
	if (selector === "@") {
		return this.state.id
	} else if (selector === "^") {
		return this.stateHistory[this.stateHistory.length - 1]
	} else if (selector === "*") {
		return undefined
	} else {
		let goBack = 0;
		while (goBack < selector.length && selector.charAt(goBack) === "^") {
			goBack++;
		}
		
		let subselector = selector.substring(goBack);
		if (goBack > 0) {
			console.log("History target");
			if (subselector.startsWith(".")) {
				let historyMatches = getSelectorMatches(selector, this.stateHistory)
				console.log("History matches: ", selector, historyMatches);
				if (historyMatches[historyMatches.length - goBack] === undefined)
					return undefined;

				// Return the last match

				return historyMatches[historyMatches.length - goBack].id;
			} else {

				console.warn("using '^' with target id, doesn't make sense in selector " + selector)
				return undefined;
			}
		} else {
			if (selector.startsWith(".")) {
				let matches = getSelectorMatches(selector, mapObjectToArray(this.map.states, s => s))
				if (matches.length === 0)
					return undefined
				return getRandom(matches).id

			}

			return selector;

		}
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
						//console.log("DOUBLE OP!", lastOp, s.value)
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
			if (typeof obj === "number")
				return obj;
			if (typeof obj === "string")
				return obj;

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

Pointer.prototype.getBidInput = function(msg, bid) {
	this.exitMap.forEach(exitWatcher => {

		exitWatcher.conditionMap.forEach(cw => {
			if (cw.condition.type === "say") {
				let targetPhrase = bid.ptr.getValue(cw.condition);
				let match = getMatchBid(this.grammarContext.grammar, targetPhrase, msg.msg);
				if (match.bid > 0) {
					cw.hasMatch = true;
					cw.matchValue = match.bid
				}
			}
		})
	})

	this.setAtPath(["INPUT"], msg.msg)
	this.setAtPath(["INPUT_SOURCE"], msg.from.id || msg.from)
	this.setAtPath(["MATCH_0"], bid.matches[0])
	this.setAtPath(["MATCH_1"], bid.matches[1])
	this.setAtPath(["MATCH_2"], bid.matches[2])
	this.setAtPath(["MATCH_3"], bid.matches[3])

	// Check 
	this.update();
}

Pointer.prototype.bidOnMessage = function(msg) {
	// which exits could use this message?

	let maxValue = 0;
	let bestExit;
	let conditionIndex;
	let bestMatches;
	this.exitMap.forEach((exit, exitIndex) => {
		exit.currentBid = undefined
		exit.conditionMap.forEach((conditionWatcher, condIndex) => {
			let c = conditionWatcher.condition;

			// TODO does this message match the type?
			if (c.type === "say") {

				let rule = this.getValue(c);

				let match = getMatchBid(this.grammarContext.grammar, rule, msg.msg)

				let value = match.bid
				// TODO modulate based on % fulfillment, "wait"ing exits are deprioritized

				if (value > maxValue) {
					maxValue = value
					bestExit = exit;
					bestMatches = match.matches
					conditionIndex = condIndex;

					exit.currentBid = value;
				}
			}
		})

		this.do("setBid", exit, exitIndex);
	})
	return {
		ptr: this,
		value: maxValue,
		exit: bestExit,
		matches: bestMatches,
		conditionIndex: conditionIndex
	};
}



Pointer.prototype.doAction = function(action) {



	switch (action.type) {
		case "say":

			action.rule = this.getValue(action.template.value);
			action.value = this.grammarContext.flatten(action.rule);
			action.time = action.value.length * this.getSpeechSpeed();

			this.chancery.output(action.value, true, this);
			break;
		case "wait":
			console.warn("WAIT ACTION NOT IMPLEMENTED")
			action.time = this.getValue(template.value);
			// this.setTimeout(() => {
			// 	doAction(actions, index)
			// }, action.value);
			break;
		case "expression":
			action.targetPath = action.template.sections[0].sections.map(s => this.getValue(s));
			action.op = action.template.sections[1].raw
			action.value = this.getValue(action.template.sections[2])

			// there should only be 2 or three
			let v0 = this.getAtPath(action.targetPath);
			let v1 = this.getValue(action.value)

			// Process any tracery strings
			if (typeof v1 === "string") {
				v1 = this.grammarContext.flatten(v1);
			}
			switch (action.op) {
				case "=":
					this.setAtPath(action.targetPath, v1);
					break;
				case "+=":
					this.setAtPath(action.targetPath, v0 + v1);
					break;
				case "-=":
					this.setAtPath(action.targetPath, v0 - v1);
					break;
				case "*=":
					this.setAtPath(action.targetPath, v0 * v1);
					break;
				case "/=":
					this.setAtPath(action.targetPath, v0 / v1);
					break;
				case "%=":
					this.setAtPath(action.targetPath, v0 % v1);
					break;
				case "^=":
					this.setAtPath(action.targetPath, Math.pow(v0, v1));
					break;

				default:
					console.warn("Unknown or unimplemented action operator:", action.op, action.raw)
			}

			break;
		default:
			console.warn("unknown action type", action);
	}
}


Pointer.prototype.on = addEventHandler;
Pointer.prototype.do = doEventHandlers;