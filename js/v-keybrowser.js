

Vue.component("content-keybrowser", {
	template: `<div class="keybrowser">
		<select><option v-for="dictKey in keyData.getDictionaryKeys()">{{dictKey}}</option></select>
		<div class="scrollable">
			
			<value-editor
				v-for="entry in directory" 
				class="keybrowser-key chip" 
				@select="selectKey(entry)"
				@changeString="val=>modifyKey(entry, val)"
				
				:class="{selected:keyData.isSelected(entry)}"
				
				:object="entry"
				index="key"
				schema="key"

				:settings="ui"
				:key="entry.uid"
				:style="keyData.getKeyStyle(entry)"
			/>
			
			
		</div>
		
	</div>`,
	methods: {
		modifyKey(entry, newKey) {
			console.log("change ", entry.key,"to", newKey)
			this.keyData.changeKey(entry, newKey)

			console.log(app.bot.data)
		},
		selectKey(entry) {
			console.log("Select!")
			this.keyData.selectEntry(entry)
		},
		arrowNav(dir) {
			
			switch(dir) {
				case "ArrowDown":
					// Set the focus on the parseeditor
					let parseeditor = document.getElementsByClassName("parseeditor")[0]
					console.log(parseeditor)
					let children = parseeditor.getElementsByClassName("value-view")
					console.log(children)
					children[0].focus()
					break;
			}
		}
	},	

	watch: {
		directory() {
			// console.log("Key directory changed")
			// console.log(this.directory.map(s => `${s.key}(${s.uid})`).join("\n"))
		}
	},
	computed: {
	
		directory() {
			return this.keyData.getDirectory()
		},
		
	},
	
	data() {
		return {
			ui: app.ui,
			keyData: app.keyData
		}
	}
})
