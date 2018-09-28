let hpn = {
	"hpnStart": ["Brax", "Brash", "Stump", "Tangle", "Star", "Stage", "Black", "Red", "Chamb", "Whit", "Gren", "Brook", "Bright", "North", "Hells", "Saints", "Fair"],
	"hpnEnd": ["bridge", "bury", "ton", "fright", "borough", "ford", "blood", "ly", "brox", "bray", "bay", "smith", "town", "lyn", "ferry", "ghost", "haven", "brook", "oaks", "ox", "wood"],
	"hpn": ["#hpnStart##hpnEnd#"],
	"name": ["Gabriel", "Lucia", "Anya", "Rachel", "Kay", "Hollis", "Holly", "Maisie", "Jasper", "Lane", "Lincoln", "Sterling", "Summer", "Miranda", "Maria", "Min", "Minnie", "Mariah", "Gus", "Dani", "Darius", "Elena", "Eduardo", "Elías", "Rajesh", "Ranjit", "Rex", "Rez", "Rey", "Yew", "Reba", "Jae-woo", "Ken", "Kira", "Jae", "Shah", "Josef", "Jørn", "Autumn", "Brandy", "Copper", "Cooper", "Harrow", "Manhattan", "Jo", "Jodi", "Karim", "Raf", "January", "Aku", "Juraj", "Yuri", "Kåre", "Lyn", "Jahan", "Mitch", "Alda", "Aimee", "Zoe", "London", "Paris", "Zuzu", "Zara", "Micah", "Song", "Sparrow", "Miguel", "Mikey", "Monette", "Michelina", "Agave", "Robyn", "Saffron", "Zeke", "Garth", "Rae", "Sebastian", "Seb", "Jake", "Bastion", "Luna", "Apple", "Delilah", "Jeremiah", "Finn", "Milo", "Finley", "April", "May", "September", "Kim", "Phineas", "Quincy", "Saul", "Rudy", "Cleo", "Noel", "Frankie", "June", "Rocky", "Pearl", "Harris", "Braxton", "Hamilton", "Ace", "Duke", "Rowan", "Stella", "Stevie", "Juniper", "Ryder", "Kai", "Judd", "Rhody", "Rho", "Sven", "Hazel", "Byron", "Edie", "Lola", "Poppy", "Jo", "Whisper", "Kaya", "Karim", "Kit", "Luca", "Rafa", "Miriam", "Aya", "Carmen", "Omar", "Anika", "Shan", "Luka", "Theo", "Emma", "Julian", "Adrian", "Ari", "Noah", "Maya", "Ariel"],
	"surnameBase": ["Chao", "Fillmore", "García", "Bond", "Wong", "Wei", "Goldsmith", "Tran", "Chu", "Baudin", "Montagne", "Moulin", "Villeneuve", "Victor", "Rodríguez", "Smith", "Johnson", "Williams", "Miller", "Stockton", "Patel", "Chaudri", "Jahan", "Christiansen", "Jones", "Stein", "Hirviniemi", "Kiuru", "Øvregard", "Singh", "Noriega", "Pine", "Clarion", "Belden", "Jaware", "Keita", "Kanu", "Geary", "Norton", "Kearny", "Aliyev", "Sato", "Tanaka", "Kim", "Lee", "Gray", "Yang", "Li", "Çelik", "Davis", "Knox", "Griffin", "Leon", "Finch", "Yoo", "Gupta", "Flores", "Lopez", "Moon", "Sun", "Castro", "Suzuki", "Torres", "Pineda", "Tsao", "Romero", "Wolf"],
	"surname": ["#surnameBase#", "#surnameBase#-#surnameBase#", "#hpn#"]

}
let localChanceries = {
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

	coffee: {
		id: "coffee", 
		title: "coffeebot",
		grammar: {
			hpnEnd: hpn.hpnEnd,
			hpn: hpn.hpn,
			hpnStart: hpn.hpnStart,
			name: hpn.name,
			surnameBase: hpn.surnameBase,
			surname: hpn.surname,

			"flavorAdj": ["special", "dark", "light", "bitter", "burnt", "savory", "flavorful", "aromatic", "fermented", "herbal", "pleasant", "harsh", "smoky", "sweet", "fresh", "refreshing", "somber", "bright", "perky", "sullen", "acidic", "sour", "peaty", "juicy", "perfumed", "buttery", "lush", "brisk", "strong", "weak", "tart", "tangy", "bold", "overpowering", "light", "faint", "subtle", "bright", "zesty", "austere", "round", "big", "buttery", "oaky", "peaty", "seedy", "gritty", "creamy", "smooth", "rustic", "complex", "chewy", "sweet", "crisp", "dense", "bold", "elegant", "sassy", "opulent", "massive", "wide", "flamboyant", "fleshy", "approachable", "jammy", "juicy", "refined", "silky", "structured", "steely", "rich", "toasty", "burnt", "velvety", "unctuous", "oily"],


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
			"liquid": ["#fruit# jam", "caramel", "salted caramel", "soy sauce", "#fruit# wine", "maple syrup", "#fruit# syrup"],
			"flavor": ["#largeFruit#", "#smallFruit#", "#herb#", "#spice#", "#liquid#", "#nut#"],
			"coffeeName": ["#hpn# #coffeeType.capitalizeAll#", "#landscapeComplex.capitalizeAll# #coffeeType.capitalizeAll#", "#name#'s #coffeeType.capitalizeAll#"],

			// "coffeeDesc": ["#flavorAttr.capitalize#.  #coffeeServingInstruction#.", "#flavorAttr.capitalize# and #flavorAttr#.  #coffeeServingInstruction#.",
			"coffeeDesc": "#flavorAdj# with hints of #flavor#"
		},

		states: {
			origin: {
				onEnterSay: "I\\'m a sentient coffeepot.\nAsk me for \\'coffee\\'\nor \\'tea\\'",
				exits: ["'tea' ->brewing drinkname='#teaName#' drinkdesc='#teaDesc#' 'making #/drinkname# \n#/drinkdesc#'",
					"'coffee' ->brewing drinkname='#coffeeName#' drinkdesc='#coffeeDesc#' 'making #/drinkname# \n#/drinkdesc#'",
					"wait:1 ->brewing drinkname='#coffeeName#' drinkdesc='#coffeeDesc#' 'no input...making #/drinkname#'"
				]
			},

			brewing: {
				onEnter: "'brewing #/drinkname#'",
				exits: ["wait:1 ->brewed"],
			},
			brewed: {
				onEnter: "'#/drinkname# is brewed'",
				exits: ["wait:1 ->origin '#/drinkname# is stale, discarding it.'",
					"'cup' ->@ 'pouring #/drinkname# for #/INPUT_SOURCE#... \n ☕️'"
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