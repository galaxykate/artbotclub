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
	if (s === undefined)
		console.warn("Undefined rule, can't parse");
	if (typeof s !== "string") {
		if (typeof s === "number") return {
			type: "number",
			raw: s,
			textValue: String(s),
			traceryRuleID: ruleCount++,
			value: s,
		}
		if (typeof s === "boolean") return {
			type: "boolean",
			raw: s,
			textValue: String(s),
			value: s,
		}
		console.warn("parse strange rule:", s);

	}

	let sections = splitIntoProtectedSections(chanceryProtection, "traceryRule", s)

	return {
		type: "rule",
		raw: s,
		traceryRuleID: ruleCount++,
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

TraceryGrammar.prototype.setRules = function(key, rules) {
	if (!Array.isArray(rules))
		rules = [rules];
	this.symbols[key] = rules.map((rule) => parseRule(rule));
}

TraceryGrammar.prototype.flatten = function(rule, context) {
	let node = this.expand(rule, context);

	// Remove escape characters
	let finished = node.finished.replace(/(?<!\\)(?:((\\\\)*)\\)(?![\\/{])/g, "")

	return finished
}



TraceryGrammar.prototype.expand = function(rule, context) {
	if (context === undefined) {
		context = this.createContext(this);
	}

	if (!rule.traceryRuleID)
		rule = parseRule(rule);

	// Create a root node
	let node = new TraceryNode(rule);
	node.expand(context);

	return node;

}

TraceryGrammar.prototype.createContext = function(settings) {
	// Create an object to track stateful things in an expansion,
	// like:
	// overlay stacks (including shuffles)
	// modifiers


	return new TraceryContext(this, settings);
}

function TraceryContext(grammar, settings) {
	this.overlays = {}
	this.blackboard = settings.blackboard;
	this.modifiers = settings.modifiers;
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

		if (this.blackboard) {
			let rules = this.blackboard.getAtPath(path)
			
			if (rules === undefined) {
				console.warn("No rules found for path", path)
				return ["{{" + path.join("/") + "}}"]
			}

			if (!Array.isArray(rules))
				rules = [rules]


			return rules;

		} else {
			console.warn("Can't use blackboard paths, no blackboard in this context")
		}
	}
	if (!(key in this.grammar.symbols)) {
		console.warn("No symbol: '" + key + "'")
		return "{{" + key + "}}"
	}
	return this.grammar.symbols[key];
}

// Do fancy stuff like conditionals, shuffling, suppression
TraceryContext.prototype.getRule = function(ruleset, node) {

	if (Array.isArray(ruleset))
		return getRandom(ruleset);

	console.log("RULE:" + rule)
	// Just return this rule
	return ruleset;
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
			//console.log("'" + this.finished + "'" + ": " + this.sections.map(s => '"' + s.finished + '"').join(","))
			break;

		case "tag":
			this.key = this.template.target.value; // TODO dynamic key
			this.ruleSet = context.getRuleSet(this.key);
			this.selectedRule = context.getRule(this.ruleSet, this);


			// Process an unprocessed rule
			if (this.selectedRule.traceryRuleID === undefined) {

				this.selectedRule = parseRule(this.selectedRule);
			}

			this.subnode = new TraceryNode(this.selectedRule);
			this.subnode.expand(context);
			this.finished = this.subnode.finished;
			if (this.template.modifiers)
				this.template.modifiers.forEach(m => {
					if (!context.modifiers) {
						console.warn("No modifiers in current context, can't apply modifier:", m.value)
					} else {
						let mod = context.modifiers[m.value]
						if (mod === undefined)
							console.warn("No modifiers named:", m.value)
						else {
							this.finished = mod(this.finished)
						}
					}

				})
			break;
		case "plaintext":
			this.finished = this.template.value;
			break;

		case "number":
			this.finished = this.template.textValue
			break;
		case "boolean":
			this.finished = this.template.textValue
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
	let rawRule = rule.raw || rule;

	let sections = rawRule.split("#");

	let r = sections.map((s, index) => {
		if (index % 2 == 0) {

			// Allow any spaces or punctuation?
			s = s.replace(" ", "\\s*");
			// s = s.replace("?", "\\?");
			// s = s.replace(".", "\\.");
			// s = s.replace("!", "\\!");
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

	let tagReg = grammar.symbols[key].map(r => {
		return traceryRuleToRegex(r, grammar);
	}).join("|")
	return "(" + tagReg + ")";
}


function getMatchBid(grammar, matchRule, sample) {
	let reg = traceryToRegex(matchRule, grammar);

	let match = reg.exec(sample);


	if (match === null)
		return {
			bid: 0
		}

	else {
		// Calculate the match pct
		return {
			bid: 1,
			matches: match.slice(0)
		}
	}

	// let found = sample.toLowerCase().indexOf(pattern.toLowerCase())

	// if (found >= 0)
	// 	return pattern.length / sample.length;
	// return 0;
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