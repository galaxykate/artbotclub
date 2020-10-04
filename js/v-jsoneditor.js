


Vue.component("content-json", {
	template: `<div style="flex:1">
	</div>`,

	methods: {
		hasFocus() {
			if (this.$el)
				return this.$el.contains(document.activeElement);
			return false
		},
		rebuildIndex() {
			// TODO: Very hacky, is there a way to do this natively in JSONEditor

			let lineNumber = 2
			let charNumber = 2

			function addSize(obj) {
				let s = JSON.stringify(obj, null, 2)
				
				charNumber += s.length,
				lineNumber += s.split("\n").length
			} 

			// Get the code-style line numbers of all top-level doodads
			this.directory = {
				paths: {},
				list: []
			}			
			for (let dictKey in this.script) {
				// Create a directory for all second-level paths in this dictionary
				
				let obj = this.script[dictKey]
				if (dictKey.startsWith("__") || dictKey == "uid" || typeof this.script[dictKey] !== "object" ) {
					addSize(obj)

				} else {

					Vue.set(this.directory.paths, dictKey, {
						line: lineNumber,
						char: charNumber,
						properties: {}
					})

					lineNumber += 1
					charNumber += dictKey.length + 3
					for (let key in obj) {
						let entry =  {
							path: [dictKey, key],
							line: lineNumber,
							char: charNumber,
						}
						Vue.set(this.directory.paths[dictKey].properties, key,entry)
						this.directory.list.push(entry)

						let subobj = obj[key]
						charNumber += key.length + 3
						addSize(subobj)
					}
				}
			}
		}
	},
	mounted() {
		let options = {
			mainMenuBar: false,
			modes: ["code"],
			
			onTextSelectionChange: (start, end, text) => {

				let y = start.row
				let last = undefined

				// console.log("text selected", start, end, text)
				for (var i = 0; i < this.directory.list.length; i++) {

					let entry = this.directory.list[i]

					if (y < entry.line) {
						break;
					}	
					else 
						last = entry
				}
				if (last) {
					app.keyData.selectPath(last.path)
				}
				
			},
			
			onChange: () => {
				try {
					let newJSON = this.editor.get()
					if (this.hasFocus()) {
						app.setBotData(newJSON, true)

						// Rebuild the index so that we know what path we're in
						this.rebuildIndex()
					
					}
					else {
						// Something else outside the editor must have changed the script
						// console.log("JSON: No change when editor doesn't have focus")
					}
				} catch(err) {
					// JSON error? return an empty file, or the last known good?
					console.warn("Error in the JSON")
				
				}

			}
		}

		this.editor = new JSONEditor(this.$el, options)
		this.editor.set(this.script)
		this.rebuildIndex()

		this.textfield = $(".jsoneditor-text")
	},
	watch:{
		path(){
			if (this.directory && !this.hasFocus) {
				// let y = Math.floor(Math.random()*10)
				// let x = Math.floor(Math.random()*10)
				// this.editor.setTextSelection({row:y,column:x},{row:y,column:x + 3})

				// Get the entry from the directory
				let entry = this.directory.paths[this.path[0]].properties[this.path[1]]
				let y = entry.line
				let x = 0
				this.editor.setTextSelection({row:y,column:x},{row:y,column:x + 3})
			}
		},
		script: {
			deep: true,
			handler(){
				// Only update when the editor doesn't have focus
				// This prevents the editor from jumping around
				if (!this.hasFocus()) {
					if (this.script) {
						this.editor.set(this.script)
						this.rebuildIndex()
					}
					else
						this.editor.update({})
					
				} else {
					console.warn("JSON: has focus, dont update the JSONeditor")
				}
			}
		}

		
	},

	computed:{

		path() {
			if (app.keyData.dictKey === undefined)
				return []
			return [app.keyData.dictKey,app.keyData.key.key]
		},
		script() {
			if (app.bot.data === undefined) {
				console.warn("empty JSON script")
				return {}
			}
			return app.bot.data
		}
	},
	data() {
		return {
			// hasFocus: false,
			directory: undefined,
			textfield:undefined
		}
	}
})
