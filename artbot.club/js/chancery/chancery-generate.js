//===========================================
let chanceryGrammar = new TraceryGrammar({
	char: "abcdefghijklmnopqrstuvwxyzaaaiiooeiou".split(""),
	shortString: ["#char#", "#char##char#", "#char##char##char#"],
	midString: ["#char##char##char##char#", "#char##char##char##char##char#"],
	saycond: ["'#shortString#'"],
	sayaction: ["'\\#word\\#'", "'\\#sentence\\#'"],
	digit: "0123456789".split(""),
	tag: ["indoors", "outdoors", "land", "sea", "air"], 
	tags: ["#tag# #tag#", "#tag#", ""], 
	number: ["-#digit#", "#digit#", "-#digit#.#digit#", "#digit#.#digit#"],
	valueop: "*^%/+-".split(""),
	condop: "== != >= <= > <".split(" "),
	actionop: "= /= += -= *= %= ^=".split(" "),
	variable: ["x", "y", "z"],
	target: ["@", "@", "^", "^.#tag#",".#tag#", "#stateID#", "#stateID#"],
	valuecond: ["#variable#","#variable#", "#variable#", "#number#","#number#", "#number#", "#number#", "(#valuecond#)#valueop##valuecond#","#valuecond##valueop#(#valuecond#)", "(#number##valueop##valuecond#)", "#valuecond##valueop##number#"],
	valueaction: ["#variable##actionop##valuecond#"],
	expcond: ["#valuecond##condop##valuecond#"],
	condition: ["#expcond#", "wait:#valuecond#"],
	conditions: ["#saycond# #condition#", "#condition#", "#saycond#"],
	action: ["#valueaction#", "#sayaction#"],
	actions: ["#action# #action#", "#action#", "#action# #action# #action#"],
	exit: "#conditions# ->#target# #actions#",
	onEnter: ["#actions#", ""],
	onExit: ["#actions#", ""],
})


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
	let endCons = ["st", "ll", "ff", "rf", "rg", "rt", "rs", "ck", "nd", "rt", "rd", "ss", "ss", "rth", "rst", "nk", "ng", "tt", "pp", "nn", "mm", "lph", "tl", "mn", "rm", "rn", "wn", "wl", "zz", "x", "ts", "tz", "bs", "cks", "lls"]
	let cons = ["n", "m", "s", "t", "r", "b", "d", "n", "m", "s", "t", "r", "b", "d", "n", "m", "s", "t", "r", "b", "d", "b", "c", "ch", "d", "d", "f", "dh", "g", "gh", "h", "j", "k", "l", "m", "n", "p", "m", "n", "p", "q", "r", "s", "r", "s", "t", "st", "sp", "sh", "th", "t", "v", "w", "y", "z"]
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
		let w = toSyl(getRandom(["0v", "0v", "v", "0v", "v", "0v1v", "0v", "0v", "v", "0v", "v", "0v1v", "0v'v", "0v'", "0v0v", "0v10v", "0v10v", "0v10v", "0v'v", "0v'", "0v0v", "0v10v", "0v10v0v"]), .99);
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

	chanceryGrammar.setRules("stateID", stateNames);


	// Create random states
	stateNames.forEach(id => {
		let exits = [];
		// Random exits
		let exitCount = Math.floor(Math.random() * 3 + Math.random()) + 3;
		for (var i = 0; i < exitCount; i++) {
			exits[i] = chanceryGrammar.flatten("#exit#")
			
		}


		let state = {
			id: id,
			tags: chanceryGrammar.flatten("#tags#"),
			onEnterSay: "in " + id + ", " + utilities.words.getRandomWord() + getRandom(["?", "!", "."]),
			onEnter: chanceryGrammar.flatten("#actions#"),
			onExit: chanceryGrammar.flatten("#actions#"),
			exits: exits
		}


		map.states[id] = state;
	})
	console.log(map);

	return map
}