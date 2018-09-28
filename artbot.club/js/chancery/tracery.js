let ruleCount = Math.floor(Math.random() * 999999)
// Utility to parse rules (rudimentary Tracery0 only)

function parseTag(s) {
	let sections = splitOnProtected(chanceryProtection, "traceryTag", s, ".")
	return {
		type: "tag",
		raw: s,
		target: parseKey(sections[0]),
		modifiers: sections.slice(1).map(s => parseKey(s)) // TODO proper function parsing
	}
}

function parseKey(s) {
	return {
		type: "key",
		value: s,
		raw: s,
	}
}

function parseAction(s) {
	let split = splitOnProtected(chanceryProtection, "traceryTag", s, ":")
	console.log("split:", split)
	if (split.length === 2) {
		if (split[1] === "POP")
			return {
				type: "pop",
				target: parseKey(split[0]),
				raw: s,
			}
		else return {
			type: "push",
			target: parseKey(split[0]),
			value: split[1],
			raw: s,
			// TODO proper rule generation
		}
	}
	return {
		type: "UNKNOWN_ACTION",
		raw: s,
	}

}

function parseRule(s) {
	let sections = splitIntoProtectedSections(chanceryProtection, "traceryRule", s)

	return {
		type: "rule",
		raw: s,
		idNumber: ruleCount++,
		sections: sections.map(section => {

			switch (section.char) {
				case "":
					return {
						type: "plaintext",
						value: section.s
					}
				case "#":
					return parseTag(section.s)
				case "[":
					return parseAction(section.s)
				default:
					console.warn("UNKNOWN RULE SECTION", section)
			}

		})
	}
}


// Create a grammar
function TraceryGrammar(rawGrammar) {
	if (rawGrammar === undefined)
		console.warn("TraceryGrammar: No raw grammar provided")
	if (typeof rawGrammar !== "object" || Array.isArray(rawGrammar))
		console.warn("TraceryGrammar: Incorrect data type for raw grammar, must be obj", rawGrammar)
	this.symbols = mapObject(rawGrammar, (rules, key) => {
		if (!Array.isArray(rules))
			rules = [rules];
		return rules.map((rule) => parseRule(rule));
	});
}

TraceryGrammar.prototype.flatten = function(rule, context) {
	let node = this.expand(rule, context);
	return node.finished
}



TraceryGrammar.prototype.expand = function(rule, context) {
	if (context === undefined) {
		context = this.createContext(this);
	}

	if (!rule.idNumber)
		rule = parseRule(rule);

	// Create a root node
	let node = new TraceryNode(rule);
	node.expand(context);

	return node;

}

TraceryGrammar.prototype.createContext = function() {
	// Create an object to track stateful things in an expansion,
	// like:
	// overlay stacks (including shuffles)
	// modifiers

	return new TraceryContext(this);
}

function TraceryContext(grammar, blackboard) {
	this.modifiers = {}
	this.overlays = {}
	this.blackboard = blackboard;
	this.grammar = grammar;
}

TraceryContext.prototype.expand = function(rule) {
	return this.grammar.expand(rule, this);
}

TraceryContext.prototype.flatten = function(rule) {
	return this.grammar.flatten(rule, this);
}

TraceryContext.prototype.getRuleSet = function(key, node) {
	if (key.startsWith("/")) {
		// TODO dynamic path
		let path = key.split("/").slice(1);
		console.log("PAAAATH", path) 
		if (this.blackboard) {
			let rules = this.blackboard.getAtPath(path)
			console.log("rules")
		} else {
			console.warn("")
		}
	}
	if (!(key in this.grammar.symbols)) {
		console.warn("No symbol: '" + key + "'")
		return ["[[" + key + "]]"]
	}
	return this.grammar.symbols[key];
}

// Do fancy stuff like conditionals, shuffling, suppression
TraceryContext.prototype.getRule = function(ruleset, node) {
	return getRandom(ruleset);
}

function TraceryNode(template) {
	this.template = template;

	this.type = template.type;

}
TraceryNode.prototype.expand = function(context) {

	switch (this.type) {
		case "rule":
			this.sections = this.template.sections.map(s => {
				return new TraceryNode(s);
			})

			this.sections.forEach(s => s.expand(context));
			this.finished = this.sections.map(s => s.finished).join("");

			break;

		case "tag":
			this.key = this.template.target.value; // TODO dynamic key
			this.ruleSet = context.getRuleSet(this.key);

			this.selectedRule = context.getRule(this.ruleSet, this);
			this.subnode = new TraceryNode(this.selectedRule);
			this.subnode.expand(context);
			this.finished = this.subnode.finished;
			break;
		case "plaintext":
			this.finished = this.template.value;
			break;
		default:
			console.warn("unknown type: ", this.type);
	}
}


//============================================
// Tracery regex

// Create a regex from a tracery rule
function traceryToRegex(rule, grammar) {


	let regRaw = traceryRuleToRegex(rule, grammar);
	return new RegExp(regRaw, "g");



}

function traceryRuleToRegex(rule, grammar) {
	let sections = rule.raw.split("#");

	let r = sections.map((s, index) => {
		if (index % 2 == 0) {
			
			// Allow any spaces or punctuation?
			s = s.replace(" ", "\\s*");
			s = s.replace("?", "\\?");
			s = s.replace(".", "\\.");
			s = s.replace("!", "\\!");
			s = s.replace("VAR", "(.*)");

			return s

		} else {

			return traceryTagToRegex(s, grammar);
		}
	}).join("");

	return r;

}

// Create a regular expression from a tracery symbol
function traceryTagToRegex(key, grammar) {

	return "(" + grammar.symbols[key].map(r => {
		return traceryRuleToRegex(r, grammar);
	}).join("|") + ")";
}

//============================================
let rawGrammar = {
	yesBase: ["yes", "yeah", "sure", "ok"],
	noBase: ["no", "nope"],
	midpunc: [",", ":", ";", ""],
	endpunc: ["!", ".", "?", ""],
	name: ["Myrtle", "Herbert", "Kea", "Phil", "Sara", "Chris"],
	color: ["red", "blue", "pink", "yellow", "white"],
	yes: ["#noBase# #yesBase#", "#yesBase#"],
	no: ["#yesBase# #noBase#", "#noBase#"],
	animal: ["cat", "dog", "koala", "cobra", "kea", "orca", "zebra", "okapi", "capybara", "hamster", "corgi"],
	choice: ["#yes##midpunc# #color##endpunc#", "#no##midpunc# #color# #animal# #endpunc#"]
}


function test() {

	let grammar = new TraceryGrammar(rawGrammar);

	let genRule = parseRule("#color# #animal# named #name#")
	let matchRule = parseRule("#color# #animal# named VAR$")


	let reg = traceryToRegex(matchRule, grammar);
	//reg = new RegExp("", "g");

	for (var i = 0; i < 0; i++) {
		let count = 0;
		let node = grammar.expand(genRule);
		let str = node.finished;
		console.log("TEST: " + str)

		// var match = reg.exec(str);

		// console.log(match); // abc

		do {
			m = reg.exec(str);
			if (m) {
				console.log(m);
			}
			count++;
		} while (m && count < 4);



	}
}

test();