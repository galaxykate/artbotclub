// All input/output stuff

let io = (function() {
	let disableCloud = true

	let db, fbui
	let prefix = "abc_"

	function getBotStorageID(metadata) {
		return prefix + "bot_" + metadata.uid
	}

	let cached = {
		bots: [],
		searchResults: []
	}

	function createEmptyLocalBot(language) {
		let metadata = {
			uid: getLocalUID(),
			location: "local",
			isPublished: false,
			createdOn: Date.now(),
			modifiedOn: Date.now(),
			desc: "",
			title: "untitled",
			language: language || "tracery",
			languageVersion: "1.0",
			tags: []
		}
		
		return {
			metadata: metadata,
			data: {
				__language: "tracery",
				grammar: {
					origin: ["hello, world!"]
				}
			}
		}
	}

	function getLocalUID() {
		let botIndex = parseInt(localStorage.getItem(prefix + "botIndex"))
		if (isNaN(botIndex)) {
			console.log("No bot index..set to 1")
			botIndex = 1
			localStorage.setItem(prefix + "botIndex", 1) 
		}
		// Initialize local storage if not 
		
		let uid = "local_" + botIndex.toString().padStart(4, '0') + "_" + utilities.words.getRandomSeed(4)

		// increment the bot index
		localStorage.setItem(prefix + "botIndex", botIndex + 1) 
		return uid
	}	

	function init() {
		console.log("INIT IO")
		
		if (!disableCloud) {
				
			try {
				// Initialize Cloud Firestore, auth, etc, through Firebase
				var firebaseConfig = {
					apiKey: "AIzaSyAHRPNDUNoiCEJYRv7z7dZRiHfRjLT4-ew",
					authDomain: "artbotclub.firebaseapp.com",
					databaseURL: "https://artbotclub.firebaseio.com",
					projectId: "artbotclub",
					storageBucket: "artbotclub.appspot.com",
					messagingSenderId: "208296117756",
					appId: "1:208296117756:web:783ddc53dc591dc2"
				};

				firebase.initializeApp(firebaseConfig);

				db = firebase.firestore();
				fbui = new firebaseui.auth.AuthUI(firebase.auth())



				// On signing in.....
				firebase.auth().onAuthStateChanged(function(userAuthData) {
					if (userAuthData) {
						// console.log("auth!", userAuthData)
						app.user.uid = userAuthData.uid
						app.user.email = userAuthData.email
					}
				});


			} catch(err) {
				console.warn("No firebase, offline", err)
			}
		}	
	}



	return {
		init: init,
		isOwned(metadata) {
			return metadata.location === "local" || 
				(metadata.location === "cloud" && app.user.uid !== undefined && metadata.authorID=== app.user.uid)
		},

		
	
		createLocalCopy(bot) {
			console.log("Clone!",bot.metadata.title, bot.metadata.uid)

			let metadata2 = deepCopyObj(bot.metadata)
			let data2 = deepCopyObj(bot.data)

			// Overrides
			metadata2.authorID = undefined
			metadata2.title += "(copy)"
			metadata2.createdOn = Date.now()
			metadata2.location = "local"
			metadata2.uid = getLocalUID()

			return {
				metadata: metadata2,
				data: data2
			}
		},
		

		createAndSaveCloudCopy() {
			return createLocalCopy(app.bot.metadata, app.bot.data).then((bot) => {
				bot.metadata.location = "cloud"
				delete bot.metadata.uid
				app.setBotTo(bot.metadata, bot.data)
				return io.saveBot(bot)
			})
		},

		
		updateMetadata(metadata, fields) {
			var metaRef = db.collection("botMetadata").doc(metadata.uid);
			let updateObj = metadata
			if (fields)
				updateObj = filterObjectByKeys(metadata, fields)
			return metaRef.update(updateObj).then(function() {
				app.setStatus(`Updated fields ${fields} of '${metadata.title}'(${metadata.uid})`)
			})
			.catch(function(error) {
				// The document probably doesn't exist.
				app.setStatus(`Error updating fields ${fields} of '${metadata.title}'(${metadata.uid})`)
			});
		},

		saveBot() {
			let bot = app.bot
			function saveableCopy(data) {
				let s = {}
				// make a copy, but ignore any __ stuff
				for (var key in data) {
					if (!key.startsWith("__")) {
						s[key] = data[key]
					}
				}
				return s
			}
			
			let data = bot.data
			let metadata = bot.metadata

			let saveData = {
				data: saveableCopy( bot.data),
				metadata: saveableCopy( bot.metadata)
			}

			metadata.modifiedOn = Date.now()
		
			if (metadata.location == "cloud") {
				if (app.user.uid === undefined) {
					app.setStatus(`Can't save to cloud without being logged in!`, "error")
					console.warn('NO USER ID')
					return Promise.reject()
				}
				// Make sure its got the right user ID, 
				// otherwise we don't have permission to save or change it
				metadata.authorID = app.user.uid
				data.__authorID = app.user.uid


				if (metadata.uid === undefined) {
					// Make sure we don't prematurely publish something
					metadata.isPublished =  false
					return db.collection("botMetadata").add(metadata).then(ref => {
					
						// Store the new id, in both the data and the metadata
						data.__uid = ref.id
						metadata.uid = ref.id
						app.setStatus(`Successfully cloud-saved metadata for '${metadata.title}'(${metadata.uid})`)
					

						return db.collection("botData").doc(metadata.uid).set(data).then(() => {
							console.log("successfully saved data")
							app.setStatus(`Successfully cloud-saved data for '${metadata.title}'(${metadata.uid}) (grammar:${Object.keys(data.grammar)})`)
					
						})
					})
				} else {
					console.warn("Save existing bot....")
					return db.collection("botMetadata").doc(metadata.uid).set(metadata).then(ref => {
						
						app.setStatus(`Successfully cloud-saved metadata for '${metadata.title}'(${metadata.uid})`)

						return db.collection("botData").doc(metadata.uid).set(data).then(() => {
							console.log("successfully saved data")
							app.setStatus(`Successfully cloud-saved data for '${metadata.title}'(${metadata.uid}) (grammar:${Object.keys(data.grammar)})`)
					
						})
					})
				}
			} else if (metadata.location == "local") {
				
				// Create a new local UID
				if (metadata.uid === undefined)
					metadata.uid = getLocalUID()


				if (!metadata.uid.startsWith("local_"))  {
					console.warn("Unexpected bot uid....", metadata.uid)
					return Promise.reject()
				}
				
				// Only stringify the metadata and data, not any other junk on the bot
				let botString = JSON.stringify({metadata:metadata, data:data}, null, 2)
				let id = getBotStorageID(metadata)
				
				localStorage.setItem(id, botString)
				app.setStatus(`Successfully locally-saved '${metadata.title}'(${metadata.uid})`)
					

				return Promise.resolve()
			} else {
				console.warn("Unknown bot save destination....", metadata.location)
			}
		},

		getBotFromCloud(uid, type) {
			if (uid === undefined)
				return Promise.reject("No UID")
			if (db === undefined)
				return Promise.reject("No database active")

			// Whenever we get bot metadata from the cloud, 
			// store it in localstorage/memory 
			// for caching and change comparison
			if (cached.bots[uid] === undefined)  {
				Vue.set(cached.bots, uid, {
					metadata: undefined,
					data: undefined
				})
			}

			let collectionName = "botData"
				if (type === "metadata")
			collectionName = "botMetadata"
			return db.collection(collectionName).doc(uid).get().then(function(doc) {
				let data = {
						error:"No data found"
					}
				if (doc.exists) {
					data = doc.data()
				}
				cached.bots[uid][type] = data
				return data;
			})
		},

		loadLocalBot(metadata) {
			let id = getBotStorageID(metadata)
			let data = localStorage.getItem(id)
			
			if (data === null)
				return undefined
			return JSON.parse(data)
		},

		loadNewLocalBot() {
			let bot = createEmptyLocalBot()
			app.loadBot(bot.metadata, bot.data)
			// add this to the list of bots?
			
		},

		deleteBot(metadata) {
			function postDelete() {
				// clear it out of the cache and make a new bot
				io.setLocal("lastMetadata", undefined)
				io.loadNewLocalBot()
			}
			switch(metadata.location) {
				case "cloud": 
					return db.collection("botData").doc(metadata.uid).delete().then(function() {
						app.setStatus(`Deleted '${metadata.title}'(${metadata.uid}) data from ${metadata.location}`)
					}).then(() => {
						return db.collection("botMetadata").doc(metadata.uid).delete().then(function() {
							app.setStatus(`Deleted '${metadata.title}'(${metadata.uid}) metadata from ${metadata.location}`)
							postDelete()
						})
					}).catch(function(error) {
						console.error("Error removing document: ", error);
						app.setStatus(error, "error")
					});

				case "local": 
					localStorage.removeItem(getBotStorageID(metadata))
					app.setStatus(`Deleted '${metadata.title}'(${metadata.uid} from ${metadata.location}`)
					postDelete()
					return Promise.resolve()
					break;
				default:
					console.warn("Can't delete bot from", metadata.location)
					return Promise.reject()
			}
		},
		

		loadBotMetadata(metadata) {
			if (metadata === undefined)
				console.error("No metadata")

			if (metadata.uid.toUpperCase().startsWith("EXAMPLE_")) {
				console.log("Load example", metadata.uid)
				let found = exampleMetadata.find(ex => ex.uid === metadata.uid)
				extend(metadata, found)
				return Promise.resolve(metadata)
			}
			if (metadata.uid.toUpperCase().startsWith("LOCAL_")) {
				let found = io.loadLocalBot(metadata)
				if (!found) {
					console.warn("No local bot", metadata.uid)
					return Promise.reject()
				}
				extend(metadata, found.metadata)
				return Promise.resolve(metadata)
		
			}
			
			// Cloud bot?
			console.warn("Unknown bot metadata type")
			console.warn(metadata.uid)
		},

		loadBotData(metadata) {
			if (metadata === undefined)
				return Promise.reject("No metadata provided")

			console.log(`Get bot data for '${metadata.title}' [${metadata.uid}](${metadata.location})`)

			let gotBot = Promise.resolve()
			switch(metadata.location) {
				case "cloud": 
					gotBot = io.getBotFromCloud(metadata.uid, "data").catch(err => console.warn(err))

				case "local": 
					// get the bot's data id
					let data = io.loadLocalBot(metadata)
					if (!data)
						return Promise.reject(metadata.uid + " does not exist in localstorage")
					
					// This object actually contains both metadata and data, 
					// so we just want the data, for consistency with cloud-stored bots
					gotBot = Promise.resolve(data.data)

					break;

				case "examples": 
					if (!metadata.uid.startsWith("EXAMPLE_"))
						console.warn("Weird example uid!", metadata.uid)
					let exampleID = metadata.uid.substring(8)
					if (exampleData[exampleID]) {
						gotBot = Promise.resolve(exampleData[exampleID])
						break
					}
					else
						return Promise.reject("Unknown example", metadata.uid)
					
				default:
					Promise.reject("Unknown location", metadata.location)
			}

			return gotBot.then((data) => {
				// Perform any imports
				if (metadata.import && metadata.import.length > 0) {
					return loadGoogleSheetGrammar(metadata.import[0].uid).then((sheetGrammar) => {
						// Copy over
						if (data.grammar !== undefined)
							extend(data.grammar, sheetGrammar)
						else 
							extend(data, sheetGrammar)
						return data	
					})
				}
				return data	
			})

		},

		createEmptyLocalBot: createEmptyLocalBot,

		passesFilter(filter, metadata) {
			return true
		},

		filterQuery(filter, query) {
			if (!filter)
				return query

			// Build the query out of the filter
			for (let key in filter.conditions) {
				let condition = filter.conditions[key]

				
				if (Array.isArray(condition)) {
					console.warn("TODO: fancy filter conditions")
				} else {
					query = query.where(key, "==", condition)
				}
			}
			return query
		},

		// Get all works matching some criteria	
		getBotMetadata(filter) {

			

			console.log("Get bots from sources with filter", filter)
			
			// What source are we looking for?
			// Load all local and examples first, as those execute immediately
			let found = []
			
			// get all local & example bots that pass the filter
			if (filter.sources.local) {
				let local = io.getLocalBots(filter)
				local.forEach(botData => found.push(botData.metadata))
			}
			else if (filter.sources.examples) {
				exampleMetadata.forEach(metadata => found.push(metadata))
			}

			
			if (filter.sources.cloud) {
				if (db === undefined) {
					let cache = io.getLocal("cachedSearch")
					if (cache) {
						console.warn("...using cached cloud results")
						cache.results.forEach(metadata => found.push(metadata))
					}
					else 
						console.warn("....no cached results to use")
					console.warn("No database loaded...is the internet connection active?")
					return Promise.resolve(found)
				}
				let query = db.collection("botMetadata")
				if (filter)
					query = io.filterQuery(filter, query)

				// Execute the query
				return query.get().then(function(querySnapshot) {
					
					querySnapshot.forEach(function(doc) {
						let data = doc.data()
						data.uid = doc.id
						found.push(data)
					});
					// Save the results in the cache
					
					io.setLocal("cachedSearch", {results:found,filter:deepCopyObj(filter)})
					console.log('Found cloud results...', found)
					
					return found	
				})
				.catch((error) => {
					console.warn("Error getting works: ", error);

				});
			} else {
				return Promise.resolve(found)
			}
		},

		getLocalBots(filter) {
			let keys = Object.keys(localStorage)
			keys = keys.filter(s => s.startsWith(prefix + "bot_"))
			let results = keys.map(key => JSON.parse(localStorage.getItem(key)))
			console.log("unfiltered", results)
			if (filter)
				results = results.filter(metadata => io.passesFilter(filter, metadata))
			console.log("filtered", results)
			
			return results
		},

		getLocal(id) {
			let s = localStorage.getItem(prefix + id)
			if (s === null)
				return undefined
			return JSON.parse(s)
		},


		setLocal(id, data) {
			if (data === undefined) {
				console.log("Can't save empty data")
				return 
			}
			if (id === undefined || typeof id !== "string") {
				console.log("Can't save data to unknown id:", id)
				return 
			}
			let s = JSON.stringify(data)
			localStorage.setItem(prefix + id, s)
		},

		signOut() {
			let user = app.user
			firebase.auth().signOut().then(function() {
				console.log("Signed out")
				user.uid = undefined
				user.profile = {}
				user.email = undefined
			}).catch(function(error) {
				// An error happened.
				console.warn(error)
			});

		},

		// Initialize the auth widget
		startAuthContainer(el) {
			fbui.start(el, {
				callbacks: {
					
					signInSuccessWithAuthResult: function (currentUser, credential, redirectUrl) {
						console.log("successfully signed in ", currentUser)
						return false;
					},
					uiShown: function () {
						// document.getElementById('firebaseui-auth-container').style.display = 'none';
					}
				},
				//Start it here 
				credentialHelper: firebaseui.auth.CredentialHelper.NONE,
				//End it here 
				signInFlow: 'popup',
				// signInSuccessUrl: (),
				signInOptions: [
				{
					provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
					requireDisplayName: false
				},
				// List of OAuth providers supported.
				// firebase.auth.GoogleAuthProvider.PROVIDER_ID,
				// firebase.auth.FacebookAuthProvider.PROVIDER_ID,
				// firebase.auth.TwitterAuthProvider.PROVIDER_ID,
				// firebase.auth.GithubAuthProvider.PROVIDER_ID
			],
			// Other config options...
		});
		}
	}
})()



const testTags = ["game","game","fiction", "game","game","fiction", "game","game","fiction", "IF", "game","game","fiction", "short", "game","game","fiction", "short", "work", "funny", "political", "profanity", "choices", "agency", "talk to a wall","political", "SHARD", "blaseball", "⚫️", "🔥", "🎲", "🤪", "👽", "🌸🌸🌸🌸🌸🌸", "eat the rich","therapy", "pen pals","pet sim", "chatroom", "virtual friends", "actual literature", "ELO collection", "jazz age", "emojis", "ascii art", "demakes", "therapy, but for me not for you", "meta", "prompt", "5 + 1", "singalong", "playlist", "nightmare fuel", "unconventional courtship generator", "sorry not sorry", "non-interactive", "hacks", "dinosaurs", "werewolves","my life","AI character", "unwinnable", "twee as heck","experimental", "jam", "procjam", "nanowrimo", "harry is a little shit", "hipsters", "restaurants", "reality TV", "100x100 challenge", "just add ninjas", "community", "request", "special request", "advice", "just screaming", "look its just bandersnatch who are we kidding", "snuggling", "choose-your-own-adventure", "furry","too furry", "french", "slash", "romance", "war", "crimes", "gay crimes", "just too gay", "what can I say I love the drama", "weather", "technology", "buddies", "road trip", "im so sorry","flirting", "therapy","psychology","tension", "science fiction", "fantasy", "not beta read","work in progress", "first-person", "drama", "theater", "philosophy", "third-person",  "second-person", "alternate universe", "angst", "my first", "cowboy", "posted elsewhere", "fanart", "violence", "mild violence", "swearing", "narrative", "game", "idle game", "cats", "dogs", "dragons", "zork", "roguelike", "fanfic", "tea party", "party game","casual creator", "story","experiment", "tech demo", "voice demo", "short", "giant", "epic", "puns", "novel", "visual novel", "kissing", "LGBTQ", "christian", "veganism", "japanese", "crime", "time travel", "simulator", "sailing", "space", "medieval", "dragons", "magical girls", "pirates", "mystery", "explorable explanation", "voice-only", "multiplayer", "singleplayer", "character", "chatbot", "puzzle room", "escape room", "explorable", "walking simulator", "shitpost", "twine", "adaptation", "challenge", "sim", "game", "shooter", "rpg", "mechanics", "AI", "words", "language game", "hard", "easy", "imposible", "robots", "near future", "far future", "dating sim", "friendship", "love", "loneliness", "depression", "sad", "happy", "cute", "silly", "serious", "educational", "math", "science", "rainbows", "small talk", "apocalypse", "cozy", "hardcore", "grimdark", "fluff", "prompt fill", "royalty", "I don't even know", "break up", "inspired by", "poetry", "art", "historical", "steampunk", "smutty", "nsfw", "feels", "conversation", "quiz"] 

function createTestBot() {

	

	let verbs = []
	let nouns = []
	let symbols = []
	symbols.push(utilities.words.getRandomWord())
	for (var i = 0; i < 6; i++) {
		verbs.push(utilities.words.getRandomVerb())
		nouns.push(utilities.capitaliseFirstLetter(utilities.words.getRandomWord()))
		if (Math.random() > .3)
			symbols.push(utilities.words.getRandomWord())
	}
	let sets = shuffle(utilities.words.wordSets.slice()).slice(0, 2 + Math.random()*4)



	function word() {
		if (Math.random() > .7)
			return getRandom(utilities.words.preposition)
		if (Math.random() > .7)
			return getRandom(utilities.words.article)
		if (Math.random() > .8)
			return getRandom(verbs)
		if (Math.random() > .8)
			return getRandom(nouns)
		let set = getRandom(sets)
		return getRandom(utilities.words[set])
	}

	function sentence(count) {
		return utilities.capitaliseFirstLetter(phrase()) + getRandom([".", ".", ".", "...", "?", "!"])
	}

	function phrase(count, capitalizeAll) {
		let s = []
		count = count || Math.random()*Math.random()*Math.random()*15 + 1
		for (var i = 0; i < count; i++) {
			let w = word()
			if (capitalizeAll)
				w = utilities.capitaliseFirstLetter(w)
			s.push(w)

		}
		s = s.join(" ")
		if (Math.random() > .8)
			s += getRandom([":", ",", ":", "--", ",", "..."]) +  " " + phrase()
		return s
	}

	let dictionary = {
		
	}
	for (var i = 0; i < symbols.length; i++) {
		let arr = []
		let ruleCount = Math.random()* Math.random()* Math.random()*15 + 1
		// console.log("rules", i, ruleCount)
		for (var j = 0; j < ruleCount;j++) {
			let s = []
			let sectionCount = Math.random()*Math.random()* Math.random()*(j*3 + 2) + 1
			// console.log("sections", sectionCount)
			for (var k = 0; k < sectionCount; k++) {
				if (Math.random() > .6)
					s.push(word())
				if (Math.random() > .6 && i > 0)
					s.push("#" + getRandom(symbols.slice(0,i)) + "#")
				if (Math.random() > .6 && i > 0)
					s.push("#" + getRandom(symbols.slice(0,i)) + "." + word() + "#")
				s.push(phrase(i*2*Math.random()*Math.random()+1))
			}
			arr.push(s.join(" "))
		}
		dictionary[symbols[i]] = arr
	}

	let desc = ""
	let count = Math.random()* Math.random()*15 + 1
	for (var i = 0; i < count; i++) {
		desc += sentence() + ""
		if (Math.random() > .5)
			desc += "<br>"
	}
	
console.log(desc)

	let modifiedOn = Date.now()
	let createdOn = Date.now()
	// if (Math.random() > .0)
	createdOn -= Math.floor(Math.random()*9999999999) + 999999
	
	let metadata = {
		isPublished: Math.random() > .3,
		createdOn: createdOn,
		modifiedOn:modifiedOn,
		desc: desc,
		title: phrase(Math.random()*5 + 1, true),
		language: getRandom(["tracery", "chancery", "greenery", "quizery"]),
		languageVersion: getRandom(["0.0", "1.0", "2.0"]),
		tags: shuffle(testTags.slice()).slice(0, Math.random()*7 + 1)
	}
	
	return {
		metadata: metadata,
		data: {
			__language: "tracery",
			grammar: dictionary
		}
	}
}

io.init()