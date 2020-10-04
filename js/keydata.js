// Track the data for some dictionaries

function KeyData() {
	let updateCount = 0;
	let keyCount = 0
	this.selected = undefined

	
	// a place to store data about keys (giving them unique ids, storing errors, etc)
	let directories = {}

	// The key directory stores each key as a unique id and text
	// that way, even when the text changes, the key is maintained
	
	//---------------------------
	// Private functions
	function createKeyEntry(dictKey, key) {
		
		let entry = {
			index: 0,
			key:key,
			dictKey: dictKey,
			uid: dictKey.substring(0,2).toUpperCase() + "_" + (keyCount++) + "_" + updateCount,
		}
		return entry
	}

	//---------------------------
	// Public functions

	// Change or delete keys

	this.changeKey = (entry, newKey) => {
		let oldkey = entry.key
		let val = this.getValue(entry)
		this.removeValue(entry, val)
		entry.key = newKey
		this.setValue(entry, val)
		console.log("change key", oldkey, newKey, val)
	}

	this.getValue = (entry) => {
		return app.bot.data[entry.dictKey][entry.key]
	}

	this.removeValue = (entry) => {
		Vue.delete(app.bot.data[entry.dictKey], entry.key)
	}

	this.setValue = (entry, val) => {
		console.log(`Set ${entry.key}(${entry.dictKey}) to`, val)
		Vue.set(this.data[entry.dictKey], entry.key, val)
		console.log(app.bot.data)
	}

	// Get the entry for a key
	// Useful for adding key styling to a socket or stackaction
	this.getKeyEntry = ({key, dictKey}) => {
		if (key === undefined || dictKey === undefined) {
			console.warn(`can't get key entry with undefined!`)
			return
		}
		if (!directories[dictKey]) {
			console.warn(`no key directory for '${dictKey}'`)
			return
		}
			
		return directories[dictKey].find((entry) => entry.key === key)
	}

	this.getDictionaryKeys = () => {
		return Object.keys(directories)

	}

	this.getDirectory = () => {
		if (!this.selected)
			return false
		return directories[this.selected.dictKey]
	}

	this.selectPath = (path) => {
		if (!Array.isArray(path)){
			console.warn("non-array path", path)
			throw("non-array path " + path)
		}
		if (path[0] === undefined || path[1] === undefined) {
			throw("undefined path")
		}
		console.log("Select path", path)
		let entry = this.getKeyEntry({key:path[1],dictKey:path[0]})
		if (entry)
			this.selectEntry(entry)
		else
			throw(`no path ${path} in current data`)
	}


	this.selectEntry = (entry) => {
		if (entry === undefined) {
			console.warn("No entry")
			return
		}

		Vue.set(this, "selected", entry)

		

		console.log(`set selected keyEntry: '${entry.key}'(${entry.dictKey}})`)

		io.setLocal("keydata_dictkey", entry.dictKey)
		io.setLocal("keydata_key", entry.key)
	}

	// Given some data, (re)create the directories

	// The goal is to keep things from jumping around as new keys are created or modified
	this.refreshKeyData = (newData) => {
		console.log(`--------------------------------------------------------------------------\nREFRESH KEY DATA (${Object.keys(newData.grammar)})`)
		this.data = newData
		
		updateCount++

		let selectedFound = false
		let lastPath = undefined
		if (this.selected)
			lastPath = [this.selected.dictKey, this.selected.key]
		// Clear the last path after saving it
		Vue.set(this, "selected", undefined)
		
		for (var dictKey in this.data) {
			let previousDir = directories[dictKey]
			Vue.set(directories, dictKey, [])
			let dict = this.data[dictKey]
			
			let keyIndex = 0
			for (key in dict) {
				let entry = previousDir?previousDir.find(e => e.key === key):undefined
				if (!entry) {
					entry = createKeyEntry(dictKey, key)
				} else {
					if (entry === this.selected)
						selectedFound = true
				}
				entry.index = keyIndex
				directories[dictKey].push(entry)
				keyIndex++;
			}
		}

		// Update the keys in local storage

		// Is the selected entry
		if (selectedFound) {
			console.log("Selected still exists", this.selected)
			return
		}

		// Is there a selected?
		if (this.selected !== undefined) {
			// Try re-selecting the last path
			console.log("Try selecting last path", lastPath)
			try {
				this.selectPath(lastPath)
				console.log("Selected a path")
			} catch(err) {
				console.warn(err)
				// Clear it
				this.selectEntry()
				return
			} 

		} 

		let savedKey = io.getLocal("keydata_key") 
		let savedDictKey = io.getLocal("keydata_dictkey") || "grammar"
		console.log(`Localstorage keyEntry ${savedKey}(${savedDictKey})`)
		
		let entry = this.getKeyEntry({dictKey:dictKey,key:savedKey}) || directories[dictKey][0]
		
		if (entry === undefined) {
			console.warn("No entry found??")
		}
		this.selectEntry(entry)
	}

	this.isSelected = (entry) => {
		return this.selected === entry
	}

	this.getKeyStyle = (entry) => {
		if (entry) {

			
			let pastel = Math.sin(entry.index*2)*.3 + .5
			let h = (entry.index*.08326 + .34)%1

			// Luminosity hack!  Make yellows darker, violets brighter
			pastel += .2 - .4*Math.sin(2*Math.PI*h + .4)
			

			let s = 1 - pastel
			let l = pastel

			let style =  {
				color: `hsla(${h*360},${s*100}%,${l*20}%,1)`,
				backgroundColor: `hsla(${h*360},${s*40 + 80}%,${l*40 + 30}%,1)`,
			}
			if (this.isSelected(entry)) {
				style.boxShadow = `0px 1px 2px rgba(0, 0, 0, .8), inset 0px 0px 0px 1px rgba(0, 0, 0, .3), 0px 0px 0px 2px rgba(0, 0, 0, .3)`

			}


			return style
		}	
	}

	// This all starts empty, and only gets filled once we load some data
}


