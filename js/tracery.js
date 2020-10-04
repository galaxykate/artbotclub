// https://github.com/umdjs/umd/blob/master/templates/amdWeb.js


(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['b'], factory);
	} else {
		// Browser globals
		root.tracery = factory(root.b);
	}
}(typeof self !== 'undefined' ? self : this, function () {


	//========================================================

	let nodeCount = 0
	function Node(template, depth=0) {
		// console.log(utilities.getTabSpacer(depth),  template)
		if (template === undefined) {
			console.warn("undefined template!")
			this.finished = "--undefined--"
			return
		}
		this.depth = depth
		this.template = template
		this.finished = ""
		this.id = nodeCount++

		// Create subnodes, as much as we can without expanding
		switch(this.template.type) {
			case "fxn":
				this.target = this.createNode(this.template.source)
				this.parameters = []
				if (this.template.parameters)
					this.parameters = this.template.parameters.map(p => this.createNode(p))
				break

			case "rg": 
				if (this.template.rgType === "rules") {
					this.sections = this.template.rules.map(rule => this.createNode(rule))
				}
				break;


			case "stackAction": 
				this.source = this.createNode(this.template.source)
				
				if (this.template.actionType === "push") {
					// Get the new ruleset
					this.ruleGenerator = this.createNode(this.template.ruleGenerator)
					console.log("Create rulegen", this.ruleGenerator)
				} 
				break

			case "text": 
				
				this.finished = this.template.raw
				break;

			case "key": 
				if (this.template.sections)
					this.sections = this.template.sections.map(section => this.createNode(section))
				else 
					this.finished = this.template.value
				break;

			case "path": 
				this.sections = this.template.path.map(key => this.createNode(key))
				break;

			case "socket": 
				this.source = this.createNode(this.template.source)
				this.selectedRule = ""
				this.mods = this.template.mods.map(mod => this.createNode(mod))
				this.modResults = this.mods.map(s => "")
				break;
			case "rule": 
				// Create nodes for each section
				this.sections = this.template.sections.map((section) => {
					return this.createNode(section)
					
				})
				break;

			default: console.warn("Creating unknown node", template)
		}
	}
	Node.prototype.createNode = function(template) {
		if (template === undefined) {
			console.warn("Can't create node with undefined template")
		}
		if (typeof template === "string")
			template = {
				type: "text",
				raw: template
			}
		return new Node(template, this.depth + 1)
	}

	Node.prototype.expand = function(context) {

		if (context === undefined)
			console.warn("Expansion of ", this.template.type, "requires context!")
		// Expand all subnodes in the required order

		if (this.sections) {
			this.sections.forEach(section => section.expand(context))
			this.finishedSections = this.sections.map(s => s.finished)
		}
					
		switch(this.template.type) {
			case "text":
				// No need to do anything for plaintext
				break;
			case "key":
				// Do dynamic key things
				if (this.sections) {
					this.finished = this.finishedSections.join("")
				}
				break;

			case "fxn": 
				this.source.expand(context)
				
				// Deal with parameters
				if (this.parameters) {
					this.parameters.forEach(p => p.expand(context))
					this.finishedParams = this.parameters.map(s => s.finished)
				}
				break;

			case "path":
				this.finished =  this.finishedSections.join(".")
				break; 

			case "rule":  
				this.finished = this.finishedSections.join("")
			
				break;

			case "rg":  
				console.log("expand a rg, type:", this.template.rgType)
				// Create the finished raw ruleset
				if (this.template.rgType === "array") {
					this.ruleNodes = this.template.rules.map(ruleTemplate => {
						console.log(ruleTemplate)
						return this.createNode(ruleTemplate)
					})

					// expand the nodes
					this.ruleNodes.forEach(node=>node.expand(context))

					this.finished = this.ruleNodes.map(rule => rule.finished)
					console.log(`finished ${this.template.rgType}:`, this.finished)
				} else {
					throw("Unknown rule generator", this.template.rgType)
				}
				break;

			case "stackAction":  
				this.source.expand(context)
				// If the source is anything other than a key, that's a problem
				if (this.source.template.type !== 'key') {
					console.warn(this.source)
					throw(`non-key stack action, type: ${this.source.type}`)
				}

				this.sourceKey = this.source.finished
				if (this.template.actionType === "push") {
					// Get the new ruleset
					this.ruleGenerator.expand(context)
					this.ruleset = this.ruleGenerator.finished
					console.log("rg", this.ruleGenerator)
					context.pushRuleset(this.sourceKey,this.ruleset)
				} else {
					context.popRuleset(this.sourceKey)
				}
				
				break;

			case "socket": {
				this.source.expand(context)
				
				this.ruleset = context.getRuleset(this.source)
				if (this.ruleset === undefined) {
					// Stub in a temp 
					this.ruleset = `((${this.source.template.raw}))`
				}


			
				this.selectedRule = context.selectRule(this.ruleset)
				if (this.selectedRule === undefined) {
					this.selectedRule = `((${this.source.template.raw}))`
					console.warn("UNDEFINED RULE")
				}
				this.ruleNode = this.createNode(this.selectedRule)
				this.ruleNode.expand(context)
				
				this.finishedRule = this.ruleNode.finished
			
				let s = this.finishedRule
				for (var i = 0; i < this.mods.length; i++) {
					let mod = this.mods[i]
					mod.expand(context)

					let fxn = context.getModifier(mod)
					if (fxn === undefined) {
						console.warn("No mod", mod.finished)
						s = s + `.${mod.finished}`
					}
					else  
						s = fxn(s)
					this.modResults[i] = {
						s: s,
						modPath: mod.finished,
						fxn: fxn
					}
				}
				this.finished = s
	
				break;
			}  
			default: console.warn("Expanding unknown node", this.template)
		}
		return this
	}

	//========================================================

	function Context({grammar, blackboard, modifiers, functions}) {
		if (grammar === undefined)
			console.warn("No grammar!")
		this.grammar = grammar
		this.blackboard = blackboard
		this.modifiers = modifiers?modifiers:baseEngModifiers
		this.functions = functions?functions:{}
		this.overlay = {}
	
	}

	Context.prototype.getModifier = function(source) {
		
		let key = source.finished
		if (this.modifiers[key]) 
			return this.modifiers[key] 
	}

	// A source of rules.  Is this a function? a path? an expression?
	Context.prototype.getRuleset = function(source) {
		switch(source.template.type) {
			case "path": 
				console.warn("Multistage path not enabled for tracery!")
				return 
			case "key": 
				
				let key = source.finished
				// TODO check overlay
				if (this.overlay[key] && this.overlay[key].length > 0) {
					// get the last
					return this.overlay[key][this.overlay[key].length - 1]
				}

				return this.grammar[key]
				break;
			
				
			default:
				console.warn("TODO: implement ruleset source:", source.template.type)
		}	
	}

	// Deal with lots of different types of rulesets
	// Depending on how parsing works, 
	//  we might not see the non-object non-'rgType' ones, 
	//  but its good to be overly cautious

	Context.prototype.selectRule = function(ruleset) {
		if (typeof ruleset === "string")
			return parseRule(ruleset)
		if (ruleset.type === "text") {
			return parseRule(ruleset.raw)
		}

		if (Array.isArray(ruleset)) {
			let index = Math.floor(Math.random()*ruleset.length)
			return ruleset[index]
		}

		if (ruleset.type === "rule")
			return ruleset

		// "rulegenerators"
		if (ruleset.type === "rg") {
			switch(ruleset.rgType) {
				case "array": 
					return this.getRandom(ruleset.rules)
			
				case "single":  
					return ruleset.rule
				
				// TODO: falldown, case, true/false tests, etc
				default: 
					console.warn("Unimplemented ruleset type", ruleset)
			}
		}

		
		console.warn("Unknown ruleset type", ruleset)
	}

	Context.prototype.flatten = function(rule) {
		return this.expand(rule).finished
	}


	Context.prototype.expand = function(rule) {
		if (rule === undefined) {
			console.warn("Can't expand an undefined rule", this)
			return {
				type: "error",
				error: "Can't expand an undefined rule"
			}
		}

		if (typeof rule === "string")
			rule = parseRule(rule)

		// Create a root node and expand out
		let root = new Node(rule)
		root.expand(this)

		return root
	}


	Context.prototype.pushRuleset = function(key, ruleset) {
		if (ruleset === undefined)
			throw("Can't push undefined ruleset to", key)
		console.log("push ruleset", ruleset)

		if (!this.overlay[key])
			this.overlay[key] = []
		this.overlay[key].push(parseRuleSet(ruleset))
	}


	Context.prototype.popRuleset = function(ruleset) {
		if (this.overlay[key]) {
			this.overlay[key].pop()
		} else {
			// TODO handle too-many-pop errors
			console.warn("Can't pop", ruleset, this.overlay)
		}
	
	}

	Context.prototype.getRandom = function(arr) {
		if (arr.length === 0)
			return 
		let item = arr[Math.floor(Math.random()*arr.length)]
		return item
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
	let tagReg = grammar[key].map(r => {
		return traceryRuleToRegex(r, grammar);
	}).join("|")
	return "(" + tagReg + ")";
}


function calculateMatch(grammar, queryRule, sample) {
	console.log("Compute bid", grammar, queryRule, sample)
	let reg = traceryToRegex(queryRule, grammar);
	console.log(reg)

	// Specificity: how rarely does this match the sample?
	let match = reg.exec(sample);
	
	if (match === null)
		return undefined

	else {
		// Calculate the match pct
		return {

			text: sample, 
			queryRule: queryRule,
			matches: match.slice(0)
		}
	}

	// let found = sample.toLowerCase().indexOf(pattern.toLowerCase())

	// if (found >= 0)
	// 	return pattern.length / sample.length;
	// return 0;
}

	return {
		calculateMatch: calculateMatch,
		createContext(settings) {
			return new Context(settings)
		},
		flatten(grammar, s) {

		},
		expand({originRule,grammar,context}) {

			if (context === undefined)
				if (grammar === undefined)
					console.warn("No grammar or context provided!")
				context = new Context({grammar:grammar})
			return context.expand(originRule)
		},
	};
}));


/**
 * @author Kate
 */

function isVowel(c) {
	var c2 = c.toLowerCase();
	return (c2 === 'a') || (c2 === 'e') || (c2 === 'i') || (c2 === 'o') || (c2 === 'u');
};

function isAlphaNum(c) {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
};
function escapeRegExp(str) {
	return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

var baseEngModifiers = {

	replace : function(s, params) {
		//http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
		return s.replace(new RegExp(escapeRegExp(params[0]), 'g'), params[1]);
	},

	capitalizeAll : function(s) {
		var s2 = "";
		var capNext = true;
		for (var i = 0; i < s.length; i++) {

			if (!isAlphaNum(s.charAt(i))) {
				capNext = true;
				s2 += s.charAt(i);
			} else {
				if (!capNext) {
					s2 += s.charAt(i);
				} else {
					s2 += s.charAt(i).toUpperCase();
					capNext = false;
				}

			}
		}
		return s2;
	},

	capitalize : function(s) {
		return s.charAt(0).toUpperCase() + s.substring(1);
	},

	a : function(s) {
		if (s.length > 0) {
			if (s.charAt(0).toLowerCase() === 'u') {
				if (s.length > 2) {
					if (s.charAt(2).toLowerCase() === 'i')
						return "a " + s;
				}
			}

			if (isVowel(s.charAt(0))) {
				return "an " + s;
			}
		}

		return "a " + s;

	},

	firstS : function(s) {
		var s2 = s.split(" ");

		var finished = baseEngModifiers.s(s2[0]) + " " + s2.slice(1).join(" ");
		return finished;
	},

	s : function(s) {
		switch (s.charAt(s.length -1)) {
		case 's':
			return s + "es";
			break;
		case 'h':
			return s + "es";
			break;
		case 'x':
			return s + "es";
			break;
		case 'y':
			if (!isVowel(s.charAt(s.length - 2)))
				return s.substring(0, s.length - 1) + "ies";
			else
				return s + "s";
			break;
		default:
			return s + "s";
		}
	},
	ed : function(s) {
		switch (s.charAt(s.length -1)) {
		case 's':
			return s + "ed";
			break;
		case 'e':
			return s + "d";
			break;
		case 'h':
			return s + "ed";
			break;
		case 'x':
			return s + "ed";
			break;
		case 'y':
			if (!isVowel(s.charAt(s.length - 2)))
				return s.substring(0, s.length - 1) + "ied";
			else
				return s + "d";
			break;
		default:
			return s + "ed";
		}
	}
};

