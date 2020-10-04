
function parseStringAs(type, s) {
	if (s === undefined)
		return {
			type: "error",
			error: "no string to parse"
		}

	if (typeof s !== "string")
		return {
			type: "error",
			error: "can't parse non-string"
		}

	if (type === "rule" || type === "ruleset") {
		return parseRule(s)
	}

	return {
		type: "error",
		error: `unimplemented parse type '${type}'`
	}

	console.warn("Unknown parsing type", type, s)
}


// The most common parse is
// #a{x}b(stuff).b.c{x}(5,a.b)#

// socket parse: split "." then into text/protected sections arrays
// ['#story#\n' for x in animal if hasTag(x,'x')][#x# if hasTag(x)] [foo:\\#adj\\#foo,bar,x][foo:['x','y','z']]
// rg parse:split on ":", then "for", "in", "if", "where"



//========================================================
// Utilities

function spacer(depth) {
	if (!depth)
		return ""
	let s = " - "
	for (var i = 0; i < depth; i++) {
		s += "\t"
	}
	return s	
}

function rejoinSections(sections) {
	let s2 = sections.map(s => {
		if (s.type === "text")
			return s.raw
		return s.openChar + s.inner + s.closeChar
	}).join("")

	return s2
}

function sectionsToString(arr) {
	return (arr.map(s => {
		if (s.type === "splitter")
			return "-" + s.raw + "-"
		else 
			return s.raw
	}).join(", "))
}
function splitIntoSubArrays(arr, splitter) {
	let indices = []

	// Get all splitter indices
	for (var i = 0; i < arr.length; i++) {
		if ((splitter === undefined && arr[i].type === "splitter") 
			|| (splitter !== undefined && arr[i].raw === splitter)) {
			indices.push(i)
		}
	}
	
	let subArrays = []
	let last = 0
	for (var i = 0; i < indices.length; i++) {
		subArrays.push(arr.slice(last, indices[i]))
		last = indices[i] + 1
	}
	subArrays.push(arr.slice(last))
	return subArrays
}




//========================================================
// Exposed


function parseChancery(raw) {
	
	let direction = ["onEnter", "onExit", "onTick"]
	let actionType = ["", "Say", "Play"]
	return {
		isParsed: true,
		states: mapObject(raw.states, (rawState,key) => {
			// Parse the state
		
			let state = {
				type:"state",
				id: key,
				actions: {}
			}
			// Process onEnter/onExit/onTick say/play/..
			for (var i = 0; i < direction.length; i++) {
				let dir = direction[i]
				state.actions[dir] = []
				for (var j = 0; j < actionType.length; j++) {
					let actionID = dir + actionType[j]
					let rawActions = rawState[actionID]

					if (rawActions !== undefined) {
						let actions = parseActions(rawActions, actionType[j].toLowerCase())
						state.actions[dir] = state.actions[dir].concat(actions)
					}
				}
			}
			return state

		}),
		grammar: parseTraceryGrammar(raw.grammar)
	}

}

function parseTraceryGrammar(raw) {
	if (raw === undefined)
		return {}
	return  mapObject(raw, (ruleset,key) => {
		let parsed = parseRuleSet(ruleset)
		parsed.context = "topLevelRuleset"
		return parsed
	})
}

function parseRuleSet(raw) {
	if (typeof raw === "string")  
		return parseRule(raw)
	if (Array.isArray(raw)) {
		return {
			type: "rg",
			rgType: "array",
			rules: raw.map(rule => parseRuleSet(rule))
		}
	} else {
		return {
			type: "rg",
			rgType: "unknown",
			raw: raw
		}
	}
}

function parseExpression(s, context) {



	let sections = parse({s:s, 
		startContext: "expression", 
		splitters:[">=", "<=", "<", ">", "!=", "!", 
		"==", "*=", "/=", "+=", "-=", "%=", "^=", 
		"=", "*", "/", "+", "-", "%", "^"]})

	return {
		raw: s,
		type: "expression",
	}
}

function parseSocket(section) {
	if (section === undefined) {
		return {
			type: "error",
			error: "No section"
		}
	}
	let parsed = parse({s: section.inner, splitters:["."], discardSplitters: true})
	
	let sourceRaw = rejoinSections(parsed.sections[0].sections)
	let modRawArray = parsed.sections.slice(1)
	
	let mods = modRawArray.map(modParsed => {
		let modRaw = rejoinSections(modParsed.sections)
		return parseValue(modRaw, "socketMod")
	})
	

	return {
		raw: section.raw,
		type: "socket",
		source: parseValue(sourceRaw, "socketSource"),
		mods: mods,
		errors: parsed.errors
	}
}

function parseStackAction(section) {
	let parsed = parse({s: section.inner, splitters:[":"], discardSplitters: false})
	let source = parseValue(rejoinSections(parsed.sections[0].sections), "stackActionSource")
	
	// TODO: deal with wrapped rule generators
	// For now, just deal with comma-separated rules (foo,bar,baz#foo#,foo\#bar\#)
	let rgRaw = section.inner.substring(parsed.sections[1].end)
	let rg = parse({s: rgRaw, splitters:[","], discardSplitters: true, ignoreProtected:true})	

	// TODO multirule

	let ruleGenerator = {
		raw: rgRaw,
		type: "rg",
		rgType: "array",
		rules: rg.sections.map(parseRule)
	}

	return {
		raw: section.raw,
		type: "stackAction",
		actionType: "push",
		source: source,
		ruleGenerator: ruleGenerator,
		// mods: parsed.sections.slice(1).map(value => parseValue(rejoinSections(value.sections), "socketMod")),
		errors: parsed.errors
	}
}

function parseKeySections(sections, context) {
	sections.forEach(s => s.context="keySection")
	let key ={ 
		type: "key",
		context:context,
		raw: rejoinSections(sections),
		sections: sections.map((section,index) => {
			switch(section.openChar){
				case "{":
					let s2 = parseSocket(section)
					s2.context = "keySection"
					return s2
					// Dynamic key section
					//return parseExpression(section.inner)
				case "(":
					if (index === sections.length - 1 && sections.length > 1) 
						return parseExpression(section.inner, "parameters")
					if (sections.length === 1)
						return parseExpression(section.inner, "protectedExpression")
					console.log("ERROR", sections)
					return {
						type:"error",
						error: `unknown () section in a value: '${rejoinSections(sections)}'`
					}
				case "[":
					// unknown
					return {
						type:"error",
						error: "unknown [] section in a value"
					}
				case undefined:
					// plaintext
					return section
					
				default: 
					return {
						type:"error",
						error: "unknown section in a value", section
					}
					
			}

		})
	}

	key.isDynamic = key.sections.length > 1 || key.sections[0].type !== "text"

	return key
}

function parseValue(s, context) {
	if (!isNaN(+s)) {
		return {
			raw: s,
			value: +s,
			type: "number"
		}
	}
	//  It may be a path "foo.bar"
	let parsedPath = parse({s:s, splitters:["."], discardSplitters: true})
	let errors = parsedPath.errors
	// reparse 
	if (parsedPath.sections.length === 0) {
		return {
			raw: s,
			type: "error",
			error: `empty value '${s}'`
		}
	}


	let keys = parsedPath.sections.map(key => {
		// errors = errors.concat()
		return parseKeySections(key.sections,context)
	})



	// Is this a path or just a key?
	if (context === "socketMod" || context === "socketSource" || context === "stackActionSource") {
		if (keys.length > 1) {
			console.warn("Unwrapped paths are not valid as socket keys", s)
			return {
				raw: s,
				type: "error",
				error: `paths are not valid as socket keys in value '${s}'`
			}
		}
		return keys[0]
	}

	return {
		type: "path",
		raw: s,
		keys: keys
	}

}

function parseRuleGenerator(s) {
	return {
		type: "rulegenerator",
		raw: s,
		errors: []
	}
}

function parseRule(s) {
	let parsed = parse({s:s, startContext:"rule"})

	let errors = parsed.errors

	let sections = parsed.sections.map(section => {
		switch (section.openChar) {
			case "#":
				return parseSocket(section)
			case "[":
				return parseStackAction(section)
			case "{":
				return {
					raw: s,
					type: "error",
					error: "todo: protected section in a rule?"
				}
			default:
				return section
		}
	})

	sections.forEach(s => s.context = "ruleSection")
	if (sections.length === 0)
		return {
			raw: s,
			type: "error",
			error: "empty"
		}


	// just return as a plaintext string
	// if (sections.length === 1 && sections[0].type === "text") {

	// 	return sections[0]
	// }
	return {
		raw: s,
		type: "rule",
		errors: errors,
		sections: sections,
	}
}




//========================================================
// Some recursive tokenizing

// Split into split sections and protected sections

// Split sections contain an array of plain and protected sections
// Each protected type has split sections


// Contexts and sections

let opPriority = {"&&":30,"||":30,
	"=": 29,"==":29,"!=":29,"^=":29,"%=":29,"*=":29,"/=":29,"+=":29,"-=":29,
	">=":28,"<=":28,">":28,"<":28,
	"++":23,"--":22,
	"+":20,"-":19,"*":18,"/":17,"^":16,"%":15, "!":1}



let closeChars = {
	"#": "#",
	"<": ">",
	"[": "]",
	"{": "}",
	"(": ")",
	"'": "'",
	"\"": "\"",
}

// Outer rules only 
let contexts = {
	rule: {
		openChars:{
			"<": "expression",
			"#": "expression",
			"[": "expression",
		}
	},
	expression: {
		openChars:{
			"#": "expression",
			"[": "expression",
			"{": "expression",
			"(": "expression",
			"'": "rule",
			"\"": "rule",
		}
	}
}



function parse({s, startContext="expression", splitters,ignoreProtected, discardSplitters}) {

	let errors = []
	if (s === undefined) {
		console.warn(`No string to parse (${startContext})`)
		return
	}
	if (startContext === undefined || typeof startContext !== 'string') {
		console.warn(`No context to parse (${startContext}) '${s}'`)
		return
	}
	if (typeof s !== "string") {
		console.warn(`Can't parse non-string (${startContext})`, s)
		return
	}




	let stack = [{
		children: [],
		type: startContext
	}]

	function getSubstring(start, end) {
		return s.substring(start, end)
	}

	// Save the last top-level text and any escape characters
	let textStart = 0
	let escapedIndices = []
	
	function addText(end) {
		topLevelSections.push({
			type: "text",
			raw: getSubstring(textStart, end)
		})
	}

	function getSplitter(index) {
		if (splitters === undefined)
			return
	
		for (var i = 0; i < splitters.length; i++) {
			if (s.startsWith(splitters[i], index)) {
				return splitters[i]
			}
		}

	}

	let topLevelSections = []

	function closeContext(context,index) {
		context.end = index + context.closeChar.length
		context.inner = getSubstring(context.start + context.openChar.length, context.end - 1)
		context.raw = s.substring(context.start, context.end)
	}
	
	// For each character, decide if it opens a protected context, 
	//  closes one, is a splitter, or is an escape character
	// Splitters, top level strings, and top-level protected contexts are 
	//  stored in the topLevelSections array 

	for (var i = 0; i < s.length; i++) {
		// Get the current context for convenience
		let context = stack[0]
		let contextType = contexts[context.type]
		if (contextType === undefined) {
			console.warn(`No context type '${context.type}'`)
		}
		let c = s[i]

		// Is this a close character? Close the current section
		if (context.closeChar === c) {
			closeContext(context, i)
			stack.shift()

			if (stack.length === 1) {
				textStart = i + context.closeChar.length
			}
		} else {

			// Is this an open character? Open a new section
			let nextContextID = contextType.openChars[c]
			if (nextContextID) {

				// Open a new context
				let nextContext = {
					start: i,
					openChar: c,
					children: [],
					closeChar: closeChars[c],
					type: nextContextID
				}

				// top-level protected section
				// add it to the top level sections, and also add any text before it
				if (stack.length === 1) {
					addText(i)
					topLevelSections.push(nextContext)
				}

				stack[0].children.push(nextContext)
				stack.unshift(nextContext)
			}
			else if (stack.length === 1){
				// Unprotected!
				// is this a splitter?
				let splitter = getSplitter(i)
				if (splitter) {
					skipTill = i + splitter.length

					addText(i)
					textStart = i + splitter.length

					topLevelSections.push({
						start: i,
						end: i + splitter.length,
						type: "splitter",
						splitter: splitter,
					})
				}
			}

		}
	}
	


	// Are we still in a protected section? ...That's bad
	
	while (stack.length > 1) {

		closeContext(stack[0], s.length)
		let error = `Unclosed '${stack[0].openChar} at index ${stack[0].start}'`
		stack[0].error = error
		errors.push(error)
		stack.shift()
		// No more plaintext here if we've got messed up sections...
		textStart = s.length
	}
	// Add any remaining text
	addText(s.length)


	// Process the top level sections
	topLevelSections = topLevelSections.filter(section => !(section.type=== 'text' && section.raw.length === 0))

	if (splitters === undefined)
		return {
			sections: topLevelSections,
			errors: errors
		}

	// TODO, bundle together the split sections
	let bundledSections = [{
		sections: []
	}]

	topLevelSections.forEach(section => {
		if (section.type === "splitter") {
			if (!discardSplitters) 
				bundledSections.push(section)
			// start a new section
			bundledSections.push({
				sections: []
			})
		} else {
			bundledSections[bundledSections.length - 1].sections.push(section)
		}
	}) 

	// Recompress all the protected sections (inefficient to do it afterwards, but TODO)
	if (ignoreProtected) {
		bundledSections = bundledSections.map((splitSection) => rejoinSections(splitSection.sections))
	
	}

	

	return {
		sections: bundledSections,
		errors: errors
	}
		
}

