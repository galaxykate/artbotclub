//===========================================

// Create a language
function createRandomGrammar() {
	// Word/sentence/grammar levels 
	function shuffleSelect(arrBase, count) {

		let arr = arrBase.slice(0)
		shuffle(arr);
		return arr.slice(0, count);
	}

	function getCount(start, end) {
		return Math.floor(Math.random() * (end - start) + start)
	}
	let levels = getCount(3, 6);


	let vowelCount = Math.floor(Math.random() * 3 + 3);
	let consCount = Math.floor(Math.random() * 3 + 3);
	let vowels = ["a", "ae", "ia", "ua", "a", "e", "io", "oi", "i", "o", "a", "i", "o", "a", "i", "o", "a", "oo", "ou", "uo", "io", "ee", "ya", "yo", "e", "i", "o", "u", "a", "e", "i", "o", "a", "e", "i", "o", "u"]
	let endCons = ["st", "ll", "ff", "rf", "rg", "rt", "rs", "ck", "nd", "rt", "rd", "ss", "ss",  "rth", "rst", "nk", "ng", "tt", "pp", "nn", "mm", "lph", "tl", "mn", "rm", "rn", "wn", "wl", "zz", "x", "ts", "tz", "bs", "cks", "lls"]
	let cons = ["n", "m", "s", "t", "r", "b", "d", "n", "m", "s", "t", "r", "b", "d", "n", "m", "s", "t", "r", "b", "d", "b", "c", "ch", "d", "d", "f", "dh", "g", "gh", "h", "j", "k", "l", "m", "n", "p", "m", "n", "p", "q", "r", "s", "r", "s", "t", "st", "sp", "sh", "th", "t", "v", "w",  "y", "z"]
	let startCons = ["dr", "chr", "shr", "fr", "fl", "kr", "kl", "pr", "pl", "sl", "sm", "wh", "wr"]


	endCons = endCons.concat(cons);
	startCons = startCons.concat(cons);

	let grammar = {
		word: [],
		phrase: [],
		sentence: [],
		midpunc: [", ", ", ", ": ", ": ", " - "],
		endpunc: [".", ".", ".", "!", "?", "?"],

	}


	grammar.v = shuffleSelect(vowels, getCount(3, 12));
	grammar.endc = shuffleSelect(endCons, getCount(3, 12));
	grammar.startc = shuffleSelect(startCons, getCount(3, 12));



	function toSyl(pattern, variationLvl) {
		let s = "";
		for (var i = 0; i < pattern.length; i++) {
			switch (pattern[i]) {
				case "0":
					if (Math.random() > variationLvl)
						s += "#startc#"
					else
						s += getRandom(grammar.startc)
					break;
				case "v":
					if (Math.random() > variationLvl)
						s += "#v#"
					else
						s += getRandom(grammar.v)
					break;
				case "1":
					if (Math.random() > variationLvl)
						s += "#endc#"
					else
						s += getRandom(grammar.endc)
					break;
				case "w":
					if (Math.random() > variationLvl)
						s += "#word#"
					else
						s += getRandom(grammar.word)
					break;
				case "p":
					if (Math.random() > variationLvl)
						s += "#phrase#"
					else
						s += getRandom(grammar.phrase)
					break;
				case "P":
					s += "#phrase#"
					break;
				case ".":
					s += "#endpunc#"
					break;
				case ",":
					s += "#midpunc#"
					break;
				default:
					s += pattern[i]
			}
		}
		return s;
	}



	function getWord() {
		let w = toSyl(getRandom(["0v", "0v", "v", "0v", "v", "0v1v","0v", "0v", "v", "0v", "v", "0v1v", "0v'v", "0v'", "0v0v", "0v10v","0v10v","0v10v","0v'v", "0v'", "0v0v", "0v10v", "0v10v0v"]), .99);
		if (Math.random() > .5)
			w += getRandom(grammar.endc);
		return w;
	}


	let wordCount = getCount(8, 15)
	for (var i = 0; i < wordCount; i++) {
		grammar.word.push(getWord());
	}

	let phraseCount = getCount(3, 7)
	for (var i = 0; i < phraseCount; i++) {
		let p = toSyl(getRandom(["w", "w w", "w'1 w", "w w w", "w v w", "w v1 w"]), .5)
		grammar.phrase.push(p);
	}

	let sentCount = getCount(4, 7)
	for (var i = 0; i < sentCount; i++) {
		let s = toSyl(getRandom(["P p.", "P,p.", "P,p p.", "P p,p.", "P p p."]), .5)
		grammar.sentence.push(s);
	}


	return grammar;
}

let sharedGrammar = createRandomGrammar()
function createRandomChancery() {
	let map = {
		states: {},
		grammar: sharedGrammar
	}

	let stateNames = ["origin"];
	let stateCount = Math.random() * 1 + 1;
	for (var i = 0; i < stateCount; i++) {
		stateNames.push("state" + i)
	}

	// Create random states
	stateNames.forEach(id => {
		let exits = [];
		// Random exits
		let exitCount = Math.floor(Math.random() * 3 + Math.random()) + 1;

		for (var i = 0; i < exitCount; i++) {
			let conditions = [];

			if (Math.random() > .5) {
				conditions.push({
					type: "wait",
					value: Math.floor(Math.random() * 3) + 1
				})
			}

			// Require a random word from the grammar
			if (Math.random() > .5) {
				conditions.push({
					type: "say",
					value: getRandom(map.grammar.word)
				})
			}

			if (conditions.length === 0 || Math.random() > .5) {
				conditions.push({
					type: "expression",
					lhs: getRandom(["x", "y", "z"]),
					op: getRandom([">", ">=", "==", "!=", "<=", "<"]),
					rhs: Math.floor(Math.random() * 3) + 1,
				});
			}



			let actions = [];

			let actionCount = Math.floor(Math.random() * Math.random() * 4) + Math.random();
			for (var j = 0; j < actionCount; j++) {
				if (Math.random() > .4) {
					actions.push({
						type: "say",
						value: getRandom(["#sentence#", "#phrase#"])
					})
				} else {
					actions.push({
						type: "expression",
						lhs: getRandom(["x", "y", "z"]),
						op: getRandom(["=", "%=", "-=", "/=", "*=", "%="]),
						rhs: Math.floor(Math.random() * 3) + 1,
					})
				}

			}


			function getRaw(c, type) {
				switch (c.type) {
					case "wait":
						return "wait:" + c.value;
					case "expression":
						return c.lhs + " " + c.op + " " + c.rhs;
					case "say":
						return '"' + c.value + '"'
					default:
						return "[[weird " + type + "]]"
				}
			}
			conditions.forEach(c => c.raw = getRaw(c, "condition"))
			actions.forEach(c => c.raw = getRaw(c, "action"))


			let target = getRandom(stateNames);
			let raw = conditions.map(a => a.raw).join("") +
				" ->" + target + " " +
				actions.map(a => a.raw).join("")

			exits.push({
				raw: raw,
				conditions: conditions,
				actions: actions,
				target: target
			})
		}

		let state = {
			id: id,
			onEnterSay: "in " + id + ", " + utilities.words.getRandomWord() + getRandom(["?", "!", "."]),
			exits: exits
		}


		map.states[id] = state;
	})

	return map
}