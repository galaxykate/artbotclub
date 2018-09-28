// Different levels have different protection

let closeChar = {
	"[": "]",
	"{": "}",
	"(": ")",
	"#": "#",
	"'": "'",
	"\"": "\""

}
let chanceryProtection = {
	expression: {
		"[": "expression",
		"(": "expression",
		"'": "traceryRule",
		"\"": "traceryRule",
	},
	traceryRule: {
		"#": "traceryTag",
		"[": "traceryAction",
	},
	traceryRuleProtected: {
		"#": "traceryTag",
		"[": "traceryAction",
		"(": "traceryRuleProtected",
	},
	traceryTag: {
		"(": "expression",
		"[": "traceryAction",
	},
	traceryAction: {
		"#": "traceryTag",
		"[": "traceryAction",
		"(": "traceryRuleProtected",
	},

}

function parseOnProtected(protection, startMode, s, handlers) {
	let stack = [];
	let currentSection;


	function pushMode(mode, index, c) {
		if (protection[mode] !== undefined) {
			currentSection = {
				mode: mode,
				startIndex: index,
				startChar: c,
				endChar: closeChar[c],
				depth: stack.length
			}
			stack.push(currentSection)
		} else {
			console.warn("no defined protection mode for:" + mode)
		}
	}

	pushMode(startMode, 0);

	let isEscaped = false;

	for (var i = 0; i < s.length; i++) {
		if (isEscaped) {
			isEscaped = false
		} else {
			let c = s[i];


			// If we're in a protected section, close it
			if (currentSection.endChar === c) {
				stack.pop();
				if (handlers.endSection)
					handlers.endSection(s, i, currentSection);

				currentSection = stack[stack.length - 1];


			} else {
				// Can we open a section?
				let innerMode = protection[currentSection.mode][c];
				if (innerMode) {
					pushMode(innerMode, i, c)
					if (handlers.startSection)
						handlers.startSection(s, i, currentSection);
				} else {
					if (c === "\\")
						isEscaped = true;
					else { // No inner section? treat as a character
						if (handlers.onChar)
							handlers.onChar(s, i, currentSection);
					}
				}
			}
		}
	}

	if (handlers.onFinish)
		handlers.onFinish(currentSection);
}

function splitOnProtected(protection, startMode, s, splitter) {

	let sections = []
	let lastIndex = 0;
	parseOnProtected(protection, startMode, s, {
		onChar: (s, i, section) => {
			// unprotected only
			if (section.depth === 0) {
				if (s.substring(i, i + splitter.length) === splitter) {
					sections.push(s.substring(lastIndex, i));
					lastIndex = i + splitter.length
				}
			}
		},
		onFinish: (section) => {
			if (section.depth === 0) {
				sections.push(s.substring(lastIndex))
			} else {
				console.warn("no completed: " + section.startChar + " at " + section.startIndex + " in '" + s + "'")
			}
		}
	})

	return sections;

}


function createProtectedParseTree(protection, startMode, s, splitHierarchy, splitterToSection, leafToSection, processSections) {

	let splitLevels = [
		[],
		[],
		[],
		[],
		[],
		[],
		[],
		[]
	];

	let lastIndex = -1;
	// get the highest index 
	parseOnProtected(protection, startMode, s, {
		onChar: (s, i, section) => {
			if (section.depth === 0) {
				if (lastIndex < i) {
					// Split on a two-char, if possible
					let s0 = s.substring(i, i + 1);
					let s1 = s.substring(i, i + 2);
					let s0i = splitHierarchy[s0];
					let s1i = splitHierarchy[s1];
					if (s1i !== undefined) {
						splitLevels[s1i].push({
							splitter: s1,
							index: i,
							lvl: s1i
						})
						lastIndex = i + 1;
					} else if (s0i !== undefined) {
						splitLevels[s0i].push({
							splitter: s0,
							index: i,
							lvl: s0i
						})
					}
				}
			}
		},
	})


	function createSubtree(lvl, startIndex, endIndex) {
		if (lvl >= splitLevels.length)
			return leafToSection(s.substring(startIndex, endIndex))

		// Find the lowest level with splitters in it
		let splitters = [];
		let lvl1 = lvl;
		do {
			splitters = splitLevels[lvl1].filter(s => s.index >= startIndex && s.index < endIndex)
			lvl1++;
		} while ((lvl1 < splitLevels.length - 1) && (splitters.length === 0))

		// No splitters?
		if (splitters.length === 0) {
			return leafToSection(s.substring(startIndex, endIndex))
		}
		// Create subtrees
		let sections = []

		// Add all the splitters and sections
		let start = startIndex;
		for (var i = 0; i < splitters.length; i++) {
			let end = splitters[i].index
			sections.push(createSubtree(lvl1, start, end))
			sections.push(splitterToSection(splitters[i].splitter));

			if (i < splitters.length)
				start = end + splitters[i].splitter.length;

		}
		sections.push(createSubtree(lvl1, start, endIndex))

		return processSections(sections.map(s => {
			if (typeof s !== "string")
				return s;
			s = s.trim();
			if (s.length > 0)
				return s
		}).filter(s => s !== undefined), s.substring(startIndex, endIndex))

	}
	let tree = createSubtree(0, 0, s.length)

	return tree;
}


function splitIntoProtectedSections(protection, startMode, s) {

	let sections = []
	let lastIndex = 0;
	parseOnProtected(protection, startMode, s, {
		startSection: (s, i, section) => {
			if (section.depth === 1) {

				// plaintext
				sections.push({
					startIndex: lastIndex,
					endIndex: i,
					char: "",
					s: s.substring(lastIndex, i)
				})
			}
		},
		endSection: (s, i, section) => {
			if (section.depth === 1) {

				// protected section
				sections.push({
					startIndex: section.startIndex,
					endIndex: i,
					char: section.startChar,
					type: section.mode,
					s: s.substring(section.startIndex + 1, i)
				})

				lastIndex = i + 1;
			}
		},
		onChar: (s, i, section) => {

		},
		onFinish: (section) => {
			if (section.depth === 0) {
				// plaintext
				sections.push({
					startIndex: lastIndex,
					endIndex: s.length,
					char: "",
					s: s.substring(lastIndex)
				})
			} else {
				console.warn("no completed: " + section.startChar + " at " + section.startIndex + " in '" + s + "'")
			}
		}
	})

	return sections.filter(s => !(s.char === "" && s.s.length === 0));

}