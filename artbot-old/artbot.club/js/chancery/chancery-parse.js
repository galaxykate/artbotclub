let expressionSplitterHierarchy0 = [
	["-=", "+=", "/=", "*=", "%=", "^=", "++", "--", "="],
	["&&", "||"],
	["==", "!=", ">=", "<=", ">", "<", "!"],
	["+", "-"],
	["*", "/"],
	["^", "%"],
]


let expressionSplitterHierarchy = {}
for (var i = 0; i < expressionSplitterHierarchy0.length; i++) {
	let set = expressionSplitterHierarchy0[i]
	for (var j = 0; j < set.length; j++) {
		expressionSplitterHierarchy[set[j]] = i;
	}
}


function parseChanceryMap(rawMap, id) {

	if (typeof rawMap !== "object" || Array.isArray(rawMap)) {
		console.warn("Map should be an object: ", rawMap)
	}
	if (typeof rawMap.states !== "object" || Array.isArray(rawMap.states)) {
		console.warn("States should be an object: ", rawMap)
	}

	// Make a shallow copy, we'll overwrite most stuff
	let map = mapObject(rawMap, obj => obj);
	if (map.grammar === undefined)
		map.grammar = {}

	map.states = mapObject(rawMap.states, (state, key) => {

		return parseChanceryState(state, key)
	})
	map.filters = rawMap.filters ? mapObject(rawMap.filters, (state, key) => parseChanceryState(state, key)) : []
	console.log("PARSED MAP", map);

	return map;

}

function createSayAction(msg) {
	return {
		type: "say",
		value: {
			type: "traceryRule",
			raw: msg,
			value: msg
		},
	}
}

// Parse a list of actions, or conditions
function parseChanceryCondActionList(list, isCondition) {
	if (typeof list === "string")
		list = splitOnProtected(chanceryProtection, "expression", list, " ") // TODO, do this with parsing

	if (!Array.isArray(list)) {
		console.warn("Malformed action list")
	}

	list = list.filter(s => s.length > "");
	return list.map((action, index) => {
		let parsed = parseChanceryCondAction(action, isCondition, index)
		if (parsed.type === "path") {
			console.warn("Bad syntax on ", list.join(" \t ") + ", \nparsed as a path with no actions taken, was this supposed to be in quotations?")
		}
		return parsed;
	});

	
}

// Non-tree expressions (no == * % && etc)
function parseChanceryUnitExpression(rawExp) {


	// Clip extra space and escape out if its just an empty string
	rawExp = rawExp.trim();
	if (rawExp.length === 0)
		return undefined;

	let sections = splitIntoProtectedSections(chanceryProtection, "expression", rawExp);

	if (sections.length === 1) {
		let s = sections[0]
		switch (s.char) {
			case "\"":
			case "'":
				return {
					raw: rawExp,
					type: "traceryRule",
					value: sections[0].s
				}
			case "(":
				return parseChanceryExpression(s.s);
			case "#":
			case "[":
				return parseChanceryPath(s.s);
			case "":
				let numericVal = toStrictNumber(s.s)
				if (numericVal !== undefined) {
					return {
						raw: rawExp,
						type: "number",
						value: numericVal
					}
				}
				return parseChanceryPath(s.s)
			default:
				console.warn("No Unit expression type: " + rawExp, sections)
				break;
		}
	} else {
		// No many options for valid expressions
		if (sections.length === 2 && sections[1].char === "(") {
			// function!
			return {
				type: "function",
				fxnPath: parseChanceryPath(sections[0].s),
				parameters: parseChanceryParameters(sections[1].s),
				raw: rawExp,
			}
		}
	}

	return {
		type: "UNKNOWN",
		raw: rawExp,
	}
}
// Parameters are lists of values
function parseChanceryParameters(rawParams) {

	let params = splitOnProtected(chanceryProtection, "expression", rawParams, ",")
	let p2 = params.map(p => parseChanceryExpression(p)).filter(p => p);
	return p2;
}

// Paths can be simple:
// "x"
// or complex
// "/x/5/[~/mynumbers/2]/foo"
function parseChanceryPath(rawPath) {

	let sections = splitOnProtected(chanceryProtection, "expression", rawPath, "/")

	return {
		type: "path",
		sections: sections.map(s => parseChanceryKey(s)),
		raw: rawPath
	}
}


// Dynamic or regular key
function parseChanceryKey(rawKey) {
	return {
		type: "key",
		value: rawKey,
		raw: rawKey
	}
}

// Expressions can be in conditions or actions
//   e.g. "x=5 y<z^4 (a||b)||c hasTag(x,#y#) ->origin"
//   "#~/x/y[4]#==5 myVariable 'hello #/name#' ->origin"
// or in names: 
//   "[myfxns/foo](a,b) ->"

function parseChanceryExpression(rawExp) {
	let tree = createProtectedParseTree(chanceryProtection, "expression", rawExp, expressionSplitterHierarchy, (splitter) => {
		return {
			type: "op",
			value: splitter,
			raw: splitter
		}
	}, (s) => {
		// a sub expression!
		return parseChanceryUnitExpression(s)
	}, (sections, s) => {
		return {
			type: "expression",
			sections: sections,
			raw: s
		}
	})

	// No need to make a whole expression node if its just a unitary thing
	// if (tree.length === 1)
	// 	return tree[0];

	return tree;
}

function parseChanceryCondAction(rawAction, isCondition, index) {
	if (typeof rawAction === "string") {


		// What type of action is this?
		let colonSplit = splitOnProtected(chanceryProtection, "expression", rawAction, ":")
		if (colonSplit.length > 1) {
			// there was a colon here
			if (colonSplit[0] === "wait") {
				return {
					type: "wait",
					raw: rawAction,

					value: parseChanceryExpression(colonSplit[1])
				}
			} else {
				// directed speech

				return {
					type: "say",
					raw: rawAction,
					target: parseChanceryExpression(colonSplit[0]),
					value: parseChanceryExpression(colonSplit[1])
				}
			}
		} else {

			let exp = parseChanceryExpression(rawAction)
			if (exp.type === "traceryRule")
				return {
					type: "say",
					raw: rawAction,
					value: exp
				}
			return exp;
		}
	} else {
		console.warn("Malformed action ", rawAction)
	}
	return {
		type: "UNKNOWN",
		raw: rawAction,
	}
}

let exitCount = 0;

function parseChanceryExit(rawExit, index) {
	// Already parsed?
	if (typeof rawExit === "string") {
		let s = splitOnProtected(chanceryProtection, "expression", rawExit, "->");
		if (s.length === 2) {

			let conditions = parseChanceryCondActionList(s[0], true);
			let s2 = splitOnProtected(chanceryProtection, "expression", s[1], " ");
			let actions = parseChanceryCondActionList(s2.slice(1), false);

			let target = parseChanceryKey(s2[0]);



			return {
				conditions: conditions,
				target: target,
				raw: rawExit,
				actions: actions,
				id: exitCount++
			}
		} else {
			// OH NO BAD FORMAT!
			if (s.length < 2)
				console.warn("BAD EXIT: no '->' found in '" + rawExit + "'")
			if (s.length > 2)
				console.warn("BAD EXIT: more than one '->' found in '" + rawExit + "'")
			return {
				isBroken: true,
				raw: rawExit,
				id: exitCount++
			}

		}
	} else {
		console.warn("Weird non-string exit detected:", rawExit)
		// Is it an obj?
		return {
			isBroken: true,
			raw: rawExit,
			id: exitCount++
		}
	}
}



function parseChanceryState(rawState, id) {

	let state = {
		id: id,
		onEnter: [],
		onExit: [],
		exits: []
	}

	if (rawState.exits) {
		let rawExits = rawState.exits;
		if (typeof rawExits === "string") {
			rawExits = [rawExits]
		}

		if (!Array.isArray(rawExits)) {
			console.warn("Exit list has wrong type, should be array", rawState)
		}
		state.exits = rawExits.map((exit, index) => parseChanceryExit(exit, index))
	}



	if (rawState.onEnterSay)
		state.onEnter.push(createSayAction(rawState.onEnterSay))
	if (rawState.onExitSay)
		state.onExit.push(createSayAction(rawState.onExitSay))

	if (rawState.onEnter)
		state.onEnter = parseChanceryCondActionList(rawState.onEnter)

	if (rawState.afterEnterSay)
		state.onEnter.push(createSayAction(rawState.afterEnterSay))
	if (rawState.afterExitSay)
		state.onExit.push(createSayAction(rawState.afterExitSay))

	return state;
}