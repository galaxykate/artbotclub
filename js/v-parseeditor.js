
// A parsed value is an object/array/string/etc that contains parseable strings
// We want a UI so the user can edit it in a non JSON context


// Edit or view a Javascript object
// some parts (strings) are parsed

// Each value has a known schema type (even if its just "number", but some are complex)
// the user can
// - add, delete, or move items in an array
// - switch a value between multiple types as specified in some schema (ie, text rule, etc)


Vue.component("content-parse", {
	template: `<div class="parseeditor">

		<div class="controls">
			<button class="toggle-button">detail</button>
		</div>
		
		<value-editor
			v-if="entry !== undefined"
			:object="dictionary"
			:index="entry.key"
			:schema="schemaID"

			:settings="ui"
		/>
	</div>`,

	data() {
		return{
			ui: app.ui,			
		}
	},
	
	computed: {


		schemaID() {
			let dictKey = app.keyData.selected.dictKey
			switch(dictKey) {
				case "grammar":return"ruleset"
				case "states":return"state"
				case "blackboard":return"blackboard"
			}
		},

		dictionary() {
			if (app.bot.data === undefined)
				return
			let dict = app.keyData.selected.dictKey
			return app.bot.data[dict]
		},
		entry() {
			return app.keyData.selected
		},
		
	}

})
