let basicMods = {
	capitalizeAll: function(s) {
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

	capitalize: function(s) {
		return s.charAt(0).toUpperCase() + s.substring(1);
	},

	a: function(s) {
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

	s: function(s) {
		switch (s.charAt(s.length - 1)) {
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
	ed: function(s) {
		switch (s.charAt(s.length - 1)) {
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
}

let hpn = {
	"hpnStart": ["Brax", "Brash", "Stump", "Tangle", "Star", "Stage", "Black", "Red", "Chamb", "Whit", "Gren", "Brook", "Bright", "North", "Hells", "Saints", "Fair"],
	"hpnEnd": ["bridge", "bury", "ton", "fright", "borough", "ford", "blood", "ly", "brox", "bray", "bay", "smith", "town", "lyn", "ferry", "ghost", "haven", "brook", "oaks", "ox", "wood"],
	"hpn": ["#hpnStart##hpnEnd#"],
	"name": ["Gabriel", "Lucia", "Anya", "Rachel", "Kay", "Hollis", "Holly", "Maisie", "Jasper", "Lane", "Lincoln", "Sterling", "Summer", "Miranda", "Maria", "Min", "Minnie", "Mariah", "Gus", "Dani", "Darius", "Elena", "Eduardo", "Elías", "Rajesh", "Ranjit", "Rex", "Rez", "Rey", "Yew", "Reba", "Jae-woo", "Ken", "Kira", "Jae", "Shah", "Josef", "Jørn", "Autumn", "Brandy", "Copper", "Cooper", "Harrow", "Manhattan", "Jo", "Jodi", "Karim", "Raf", "January", "Aku", "Juraj", "Yuri", "Kåre", "Lyn", "Jahan", "Mitch", "Alda", "Aimee", "Zoe", "London", "Paris", "Zuzu", "Zara", "Micah", "Song", "Sparrow", "Miguel", "Mikey", "Monette", "Michelina", "Agave", "Robyn", "Saffron", "Zeke", "Garth", "Rae", "Sebastian", "Seb", "Jake", "Bastion", "Luna", "Apple", "Delilah", "Jeremiah", "Finn", "Milo", "Finley", "April", "May", "September", "Kim", "Phineas", "Quincy", "Saul", "Rudy", "Cleo", "Noel", "Frankie", "June", "Rocky", "Pearl", "Harris", "Braxton", "Hamilton", "Ace", "Duke", "Rowan", "Stella", "Stevie", "Juniper", "Ryder", "Kai", "Judd", "Rhody", "Rho", "Sven", "Hazel", "Byron", "Edie", "Lola", "Poppy", "Jo", "Whisper", "Kaya", "Karim", "Kit", "Luca", "Rafa", "Miriam", "Aya", "Carmen", "Omar", "Anika", "Shan", "Luka", "Theo", "Emma", "Julian", "Adrian", "Ari", "Noah", "Maya", "Ariel"],
	"surnameBase": ["Chao", "Fillmore", "García", "Bond", "Wong", "Wei", "Goldsmith", "Tran", "Chu", "Baudin", "Montagne", "Moulin", "Villeneuve", "Victor", "Rodríguez", "Smith", "Johnson", "Williams", "Miller", "Stockton", "Patel", "Chaudri", "Jahan", "Christiansen", "Jones", "Stein", "Hirviniemi", "Kiuru", "Øvregard", "Singh", "Noriega", "Pine", "Clarion", "Belden", "Jaware", "Keita", "Kanu", "Geary", "Norton", "Kearny", "Aliyev", "Sato", "Tanaka", "Kim", "Lee", "Gray", "Yang", "Li", "Çelik", "Davis", "Knox", "Griffin", "Leon", "Finch", "Yoo", "Gupta", "Flores", "Lopez", "Moon", "Sun", "Castro", "Suzuki", "Torres", "Pineda", "Tsao", "Romero", "Wolf"],
	"surname": ["#surnameBase#", "#surnameBase#-#surnameBase#", "#hpn#"]

}
let localChanceries = {
	test: {
		states: {
			origin: {
				onEnterSay: "hello",
				onEnter: "x=5",
				exits: ["->s0"]
			},
			s0: {
				onEnterSay: "State0",
				onEnter: "'#/x#'",
				exits: ["x<4 ->s1", 
				"->s0 x-=1 'reduced:#/x#'"]
			},
			s1: {
				onEnter: "'#/x#' y+=1 '#/f#'",
			}
		}
	},

	// test: {
	// 	id: "test",
	// 	title: "test-bot",
	// 	grammar: {
	// 		color: ["magenta", "silver", "ecru", "red", "turquoise", "purple", "green", "grey", "blue", "beige", "crimson", "periwinkle", "orange"],
	// 		animal: ["cat", "dog", "lemur", "alpaca", "corgi", "zebra", "leopard", "cougar", "cobra", "unicorn", "dragon", "llama", "hamster", "elephant"],
	// 		place: ["Burningman", "the beach", "Santa Cruz", "lower Manhattan", "the moon", "the library"],
	// 		story: ["the #color# #animal# went to #place#"]
	// 	},
	// 	states: {
	// 		origin: {
	// 			exits: ["-2 x+3 y=5^(z + 1) ->origin",
	// 				"test(a,b+1) wait:x*5 'say #something.foo(bar)#' x=(y+1+[../foo/bar]) ->'#foo#bar' myBot:'test'"
	// 			]
	// 		}
	// 	}
	// },
	hellobot: {
		id: "hellobot",
		modifiers: basicMods,
		title: "Hello Bot",
		grammar: {
			animal: ["cat", "dog", "lemur", "alpaca", "corgi", "zebra", "leopard", "cougar", "cobra", "unicorn", "dragon", "llama", "hamster", "elephant"],
		},
		voice: {
			letterSpeed: 3,
			voiceType: "UK English Female"
		},
		states: {
			origin: {
				exits: [
					"wait:1 ->@ 'Hello I am #animal.a#'",
				]

			}
		},
	},

	letterbot: {
		id: "letterbot",
		title: "Letter-writing bot",

		grammar: {
			animal: ["cat", "dog", "lemur", "alpaca", "corgi", "zebra", "leopard", "cougar", "cobra", "unicorn", "dragon", "llama", "hamster", "elephant"],

			letter: "abcdeabcdeabcdefghijklmnopqrstuvwxyzzzzz".split(""),
			word: ["#letter##word#", "#letter##letter##word#", "#letter##letter##letter##letter##letter##letter##letter##letter##letter##letter#", "#letter##letter##letter##letter##letter##letter##letter##letter##letter##letter##letter#"]
		},
		states: {
			origin: {
				exits: ["'#animal#' ->@ '#/INPUT_SOURCE# said #/INPUT#, animal: #/MATCH_0#'",
					"wait:1 ->@ '#word#'",
				]

			}
		},
		modifiers: basicMods,
		fxns: {

		}
	},



	buzzbot: {
		grammar: {
			vowel: "aeiou".split(""),
		},
		id: "buzzbot",
		desc: "I add extra zs to anything with zs in it",
		states: {
			origin: {
				exits: ["'#vowel#' ->@ 'VOWEL:#/MATCH_0#'", "'z' ->@ '#/INPUT.z#'"]
			}
		},
		modifiers: {
			z: (s) => {
				console.log("ZZZify: ", s, s.replace("z", "zz"))
				return s.replace("z", "zzzz")
			}
		},
		fxns: {

		}
	},

	coffee: {
		voice: {
			letterSpeed: 3,
			voiceType: "UK English Female"
		},
		id: "coffee",
		title: "coffeebot",
		modifiers: basicMods,
		grammar: {
			hpnEnd: hpn.hpnEnd,
			hpn: hpn.hpn,
			hpnStart: hpn.hpnStart,
			name: hpn.name,
			surnameBase: hpn.surnameBase,
			surname: hpn.surname,
			"landscapeAdj": ["rainy", "windy", "old", "grey", "dark", "creaky", "quiet", "silent", "fair", "shadow", "verdant", "sunny", "far", "near", "dry", "dead"],
			"landscapeFeature": ["river", "mountain", "forest", "mines", "pines", "falls", "glen", "garden", "mansion", "village", "isle", "bayou", "swamp", "hill", "creek", "rainforest", "desert"],
			"landscapeComplex": ["#landscapeAdj# #landscapeFeature#"],

			"flavorAdj": ["special", "dark", "light", "bitter", "burnt", "savory", "flavorful", "aromatic", "fermented", "herbal", "pleasant", "harsh", "smoky", "sweet", "fresh", "refreshing", "somber", "bright", "perky", "sullen", "acidic", "sour", "peaty", "juicy", "perfumed", "buttery", "lush", "brisk", "strong", "weak", "tart", "tangy", "bold", "overpowering", "light", "faint", "subtle", "bright", "zesty", "austere", "round", "big", "buttery", "oaky", "peaty", "seedy", "gritty", "creamy", "smooth", "rustic", "complex", "chewy", "sweet", "crisp", "dense", "bold", "elegant", "sassy", "opulent", "massive", "wide", "flamboyant", "fleshy", "approachable", "jammy", "juicy", "refined", "silky", "structured", "steely", "rich", "toasty", "burnt", "velvety", "unctuous", "oily"],

			"flavorMod": ["special", "dark", "light", "bitter", "burnt", "savory", "flavorful", "aromatic", "fermented", "herbal", "pleasant", "harsh", "smoky", "sweet", "fresh", "refreshing", "somber", "bright", "perky", "sullen", "acidic", "sour", "peaty", "juicy", "perfumed", "buttery", "lush", "brisk", "strong", "weak", "tart", "tangy", "bold", "overpowering", "light", "faint", "subtle"],
			"flavorWeird": ["tobacco", "agave", "sea salt", "kosher salt", "motor oil", "lavender", "spice", "black pepper", "bubblegum", "cardamom", "pumpkin spice", "caramel", "peppermint", "walnut", "acid", "pear", "citrus", "grenadine", "smoke", "iodine", "coriander", "cinnamon", "acid", "salt", "sugar", "maple", "coffee", "whiskey", "regret", "sorrow", "blood", "gasoline", "grass", "cigarettes", "pine", "tar", "saltwater", "rosewater", "jasmine", "espresso", "green apple"],

			"toasted": ["toasted", "burnt", "singed", "fried"],
			"cream": ["coconut milk<coconut><nut>", "whipped cream<dairy>", "almond milk<nut>", "hemp milk", "organic milk<dairy>", "soy", "fermented dairy", "yoghurt", "goat's milk"],
			"coffeeServing": ["with a dollop of #cream#", "as a #cream# latte", "topped with #cream# foam", "black", "as a pourover", "clover-style", "French Press", "in a teacup", "in a moka pot", "in a teapot", "in a pile of discarded Keurig cups", "with #cream#"],
			"coffeeServingInstruction": ["Served #coffeeServing#", "Available #coffeeServing# or #coffeeServing#", "Try it #coffeeServing#", "Available #coffeeServing#"],
			"coffeeType": ["arabica", "decaf", "mocha", "grind", "espresso", "french roast", "dark roast", "light roast", "#flavorMod# roast", "extra #flavorMod# roast"],
			"topping": ["#herbPrep# #herb#", "#spice# and #spice#", "#nut.s#", "#smallFruit#"],
			"sprinkled": ["topped", "accessorize", "sprinkled", "accented"],
			"smallIngredient": ["#smallFruit.s#", "chopped #nut.s#", "shredded #herb#"],
			"nut": ["almond", "macademia nut", "cacao nib", "walnut", "pumpkin seed", "cashew", "pecan", "pistachio"],
			"smallFruit": ["black cherry", "raisin", "cranberry", "blueberry", "raspberry", "lingonberry", "boysenberry", "elderberry", "black grape", "champagne grape", "blackberry", "marionberry", "açaí berry", "blackcurrant", "currant", "pomegranate seed"],
			"herbObj": ["rose petal", "cacao nib", "chocolate sprinkle", "chocolate shaving", "mint leaf"],
			"largeFruit": ["kumquat", "honeydew", "bittermelon", "cherimoya", "peach", "sugar apple", "persimmon", "green apple", "jackfruit", "damson plum", "kiwi", "lime", "key lime", "meyer lemon", "pomegranate", "green apple", "pineapple", "mandarin orange", "blood orange<citrus>", "plum", "bosque pear", "fig", "persimmon", "durian", "mango", "lychee"],
			"herb": ["fennel", "cilantro", "mint", "basil", "thyme", "Thai basil", "oregano", "peppermint", "spearmint", "rosemary"],
			"spice": ["vanilla", "nutmeg", "allspice", "turmeric", "cardamom", "saffron", "cinnamon", "chili powder", "cayenne", "coriander", "black pepper", "white pepper", "ginger", "za’atar"],
			"fruit": ["#smallFruit#", "#largeFruit#"],
			"liquid": ["#fruit# jam", "toffee", "butterscotch", "coffee", "whiskey", "port wine", "caramel", "salted caramel", "soy sauce", "#fruit# wine", "maple syrup", "#fruit# syrup"],
			"flavor": ["#largeFruit#", "#smallFruit#", "#herb#", "#spice#", "#liquid#", "#nut#", "#flavorWeird#"],
			"coffeeName": ["#hpn# #coffeeType.capitalizeAll#", "#landscapeComplex.capitalizeAll# #coffeeType.capitalizeAll#", "#name#'s #coffeeType.capitalizeAll#"],

			// "coffeeDesc": ["#flavorAttr.capitalize#.  #coffeeServingInstruction#.", "#flavorAttr.capitalize# and #flavorAttr#.  #coffeeServingInstruction#.",
			"coffeeDesc": "#flavorAdj# with hints of #flavor#"
		},

		states: {
			origin: {
				onEnterSay: "I\\'m a sentient coffeepot.\nAsk me for \\'coffee\\'\nor \\'tea\\'",
				exits: ["'tea' ->brewing drinkname='#teaName#' drinkdesc='#teaDesc#' 'making #/drinkname# \n#/drinkdesc#'",
					"'coffee' ->brewing drinkname='#coffeeName#' drinkdesc='#coffeeDesc#' 'making #/drinkname# \n#/drinkdesc#'",
					"wait:15 ->brewing drinkname='#coffeeName#' drinkdesc='#coffeeDesc#' 'no input...making #/drinkname#'"
				]
			},

			brewing: {
				onEnter: "'brewing #/drinkname#'",
				exits: ["wait:1 ->finishedBrewing"],
			},
			finishedBrewing: {
				onEnter: "'#/drinkname# is brewed' cups=5",
				exits: ["->brewed"],
			},
			brewed: {
				onEnter: "'#/cups# remaining'",
				exits: [
					"cups==0 ->origin 'out of coffee!'",
					"wait:15 ->origin '#/drinkname# is stale, discarding it.'",
					"'cup' ->@ 'pouring #/drinkname# for #/INPUT_SOURCE#... \n ☕️' 'it tastes #flavorMod#' cups-=1"
				],
			}
		},
		selectors: {
			default: {
				exits: ["* ->@ 'I don't understand ~#/INPUT#~"]
			}
		}


	}
}