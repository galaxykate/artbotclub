
function toDisplayDate(timestamp) {
	let date = new Date(timestamp)
	
	let time = date.toLocaleTimeString();
	date = date.toDateString()
	let today =  new Date()
	let yesterday = new Date((new Date()).setDate(today.getDate() - 1))
	
	today = today.toDateString()
	yesterday = yesterday.toDateString()
	

	if (date === today)
		return time
	if (date === yesterday)
		return "yesterday, "  + time
	return date
}


Vue.component("selector-set",  {
	template: `
		<div class="selectorset">
		
			<button 
				v-for="item in options"
				@click="setVal(item)" 
				:class="{selected:selected===item}">
				{{item.label?item.label:item}}
			</button>
		</div>`,
	mounted() {
		this.selected = this.value
	},
	methods:{
		setVal(item) {
			this.selected = item
			this.$emit("input", item)
		}	
	},
	data() {
		return {
			selected: undefined
		}
	},

	props:["options", "value"]


})

//===================================================================================================
//===================================================================================================
//===================================================================================================
// Alternate between content-editable


// modifying a string....somewhere
// use the same object/index technique as the value editor?

function setCaret(el, index) {
	var range = document.createRange()
	var sel = window.getSelection()

	range.setStart(el, index)
	range.collapse(true)

	sel.removeAllRanges()
	sel.addRange(range)
}


// Edit a value.  
// It has a location (object and index) so that if it gets changed or remade, Vue will know
// It has a type, 

// Do we need to show everything?

let baseSchemaTypes = ["dict","array", "object", "string", "number", "boolean"]

Vue.component("value-editor", {
	template: `
		<div v-if="value.displayType" class="unit">
			<div class="unit-bg" :style="unitBG"></div>
			<div class="unit-fill" :style="unitFill"></div>
			<div class="unit-label" :style="unitLabel">{{value.value?value.value.toFixed(2):0}}</div>
		</div>
		<div v-else-if="displayAsPropData">
				
				<value-editor
					:index="displayAsPropData.key" 
					:object="value" 
					:settings="settings" 
					:schema="displayAsPropData.type"/>
			
		</div>
		<div
			v-else
			class="value-view" 
			:class="{['value-view-' + datatype]:true,['value-view-' + schemaID]:schemaID!==undefined,selected:isSelected}"
			:tabindex="0"
			@dblclick.stop="activate"
			@click.stop="select"
			@focus="select"
			@blur="deselect"
			@keydown.escape.stop="deactivate"
			@keydown.enter.capture.stop="activate"
			>

			<header v-if="isActive" class="controls">
				
				<span class="ui-ultradetail" v-if="schemaID">{{schemaID}}</span>
				<span class="ui-ultradetail-contrast">({{datatype}})</span>
				<button class="svg-button" @click="remove">🗑</button>
			</header>

			<div v-if="value === undefined">EMPTY</div>
			
			<div ref="stringeditor" 
				v-else-if="datatype==='string'" 
				class="stringeditor" 
				@focus="startStringEdit" 
				@blur="stopStringEdit" 
				contenteditable=true
				 @keyup="changeString" >
				{{isStringEditing?displayValue:value}}
			</div>


			<div :class="{arrayholder:datatype=='array',objectholder:datatype!=='array'}" v-else-if="datatype==='object' || datatype==='array' || datatype==='dict'" >
				
				<div class="value-view-item" v-for="(item,itemKey) in items">
					<!-- label -->
					<div v-if= "datatype!=='array'" class="ui-label">{{itemKey}}:</div>
					<!-- the value-->
					<value-editor  
						v-if="item !== undefined"
						:index="itemKey" 
						:object="value" 
						:settings="settings" 
						:schema="itemType(itemKey)"/>
					<div v-else class="ui-subtle">--empty--</div>
				</div>
				<!-- objects are immutable-ish -->
				<button v-if="datatype !== 'object' && isActive" @click="addItem">+</button>
				
			</div>

			<div v-else>
				UNKNOWN SCHEMA<br>
				schema:{{schema}}<br>
				data:{{schemaData}}<br>
				value:{{value}}
			</div>



			<!-- show the parsed version -->
			<div v-if="parsed">
				<ery-component :template="parsed" :settings="settings" />
			</div>
		</div>
	`,
	computed: {
		unitHue() {
			return this.value.value*360
		},
		unitFill() {
			return {
				height: this.value.value*100 + "%",
				boxShadow: `inset 1px 5px 10px hsla(${(this.unitHue + 250)%360}, 100%,${(this.value.value*.2 + .7)*100}%,1), inset -2px -5px 10px hsla(${this.unitHue}, 100%,${(this.value.value*.3 + .1)*100}%,1)`,
				backgroundColor: `hsla(${this.unitHue -50}, 100%,${(this.value.value*.3 + .3)*100}%,1)`
			}
		},
		unitBG() {
			return {
				backgroundColor: `hsla(${this.unitHue}, 100%,${(this.value.value*.1 + .1)*100}%,1)`
			}
		},
		unitLabel() {
			return {
				color: `hsla(${this.unitHue}, 100%,90%,1)`
			}
		},
		value() {
			if (this.object[this.index] === undefined) {
				console.warn("No value for", this.index, this.object)
			}
			return this.object[this.index]
		},
		isActive() {
			return this.settings.active.index === this.index && this.settings.active.object === this.object
		},
		isSelected() {
			return this.settings.selected.index === this.index && this.settings.selected.object === this.object
		},
		parsed() {
			if (this.schemaData.type === 'string' && this.schemaData.parseAs) {
				return parseStringAs(this.schemaData.parseAs, this.value)
			}
		},

		items() {
			if (this.value === undefined)
				console.warn("undefined value for collection", this.schemaData)
			if (this.datatype === "dict" || this.datatype === "array") {
				return this.value
			}
			if (this.datatype === "object") {
				// Create a stripped down object of the current value with just the properties
				let data = {}
				this.schemaData.props.forEach((propData) => {
					if (this.value[propData.key] !== undefined)
						data[propData.key] = this.value[propData.key]
				}) 
				// console.log("Stripped data:", data)
				return data
			}
			console.warn("undefined collection", this.value, this.schemaData)

		},

		displayAsPropData() {
			if (this.schemaData === undefined)
				console.warn(this.schema)

			if (this.schemaData.displayAsKey)  {
				// Show this object as just one of its keys 
				// (useful for complicated objects where we don't need to show all of its properties)

				// Which of the properties matches our display requirements?
				let found = this.schemaData.props.find(propData => {
					if (propData.key === this.schemaData.displayAsKey || this.schemaData.displayAsKey.includes(propData.key)) {
						return this.value[propData.key] !==undefined
					}
				})
				return found
			}
		},

		schemaID() {
			if (this.schemaData === undefined)
				return "--undefined schemaData--"
			return this.schemaData.id
		},

		schemaReference() {
			if (typeof this.schema !== "string")
				return

			// Plain type?
			if (baseSchemaTypes.includes(this.schema))
				return

			let refSchema = this.settings.schema[this.schema]
			if (refSchema)
				return refSchema
			else
				console.warn(`No schema id for '${this.schema}' in schema`, this.settings.schema)	
		},

		schemaOptions() {
			if (Array.isArray(this.schema))
				return this.schema
			if (Array.isArray(this.schemaReference))
				return this.schemaReference
			return
		},

		datatype() {
			
			return this.schemaData.type
		},

		// Get the schema for this
		schemaData() {

			if (this.schemaOptions) {
				// Get the matching one
				let matching = this.schemaOptions.filter(subschema => {
					switch(subschema.type) {
						case "boolean":
						case "string":
						case "number":
							return subschema.type === typeof this.value
						case "object":
							if (this.value !== 'object')
								return false
							console.log("Check subschema props for a match", subschema)
							// Are there matching properties?
							let missingProps = (subschema.props).filter(propData => this.value[propData.key] === undefined)
							return missingProps.length === 0
						case "dict":
							return typeof this.value === "object" && !Array.isArray(this.value)
						case "array":
							return typeof this.value === "object" && Array.isArray(this.value)
						default: 
							console.warn("unknown schema option type", subschema)
					}
				})
				if (matching.length === 0) {
					console.log("No matches for ", this.value, this.schemaOptions)
					return {
						type: "error",
						schema: this.schema
					}
				}
				return matching[0]

			}
			if (typeof this.schema==='string') {
				if (baseSchemaTypes.includes(this.schema)) {
					return {
						isBaseType: true,
						type: this.schema
					}
				}
				if ( this.schemaReference)
					return this.schemaReference
				console.warn("No schema interpretation for string", this.schema)
			}
			if (typeof this.schema==="object" && this.schema.type !== undefined)
				return this.schema

			console.warn("unknown schema type", this.schema)
			return {
				type:"error",
				schema: this.schema
			}
		},

	},
	methods: {
		addItem() {
			if (this.datatype === "dict") {
				Vue.set(this.value, "key" + Math.floor(Math.random()*100), "test")
			}
			else if (this.datatype === "array") {
				this.value.push("test")
			}
		},
		itemType(key) {
			if (this.datatype === "object") {
				// /	console.log("Get the custom type", key, this.schemaData.props)
				let prop = this.schemaData.props.find(prop => prop.key === key)
				if (prop && prop.type)
					return prop.type

				throw(`No datatype for object property '${key}'`)
				return
			}
			// console.log("Get subytpe for", this.schemaData)
			return this.schemaData.itemType
		},

		startStringEdit() {
			this.select()
			this.isStringEditing = true
			this.displayValue = this.value
		},
		stopStringEdit() {
			this.isStringEditing = false
			
		},
		
		changeString(ev) {
			let newText = ev.target.innerText
			this.$emit("changeString", newText)
			Vue.set(this.object, this.index, newText)
		},
		remove() {
			console.log(`REMOVE: index:${this.index} (${this.datatype})`)
		},
		select() {
			if (!this.isSelected) {
				// Also deactivate the previous
				Vue.set(this.settings, "active", {})
				Vue.set(this.settings, "selected", {
					index: this.index,
					object: this.object
				})
				this.$emit("select")
				
				// if (this.datatype === "string") {
				// 	// Jump to the content editable section
				// 	console.log("JUMP TO ")
				// 	this.$refs.stringeditor.focus()
				// 	setCaret(this.$refs.stringeditor, 0)
				// }
			
			}	
		},
		deselect() {
			Vue.set(this.settings, "selected", {})
			this.$emit("deselect")
		},
		activate(ev) {
			console.log("ACTIVATE")
			ev.preventDefault()
			Vue.set(this.settings, "active", {
				index: this.index,
				object: this.object
			})
			this.$emit("activate")
		},
		deactivate() {
			Vue.set(this.settings, "active", {})
			this.$emit("deactivate")
		}
	},
	mounted() {
		this.lastValue = this.value

		// console.log("VALUE EDITOR", this.datatype, this.value, this.schemaData)
	},
	data() {
		return {
			isStringEditing: false,
			displayValue: this.value
		}
	},
	props: {
		object:{
			required:true
		}, 
		index: {
			required: true
		},

		// What kind of object is this?  Can be 
		//  - an id for the settngs.schema
		//  - a string "string","number", etc
		//  - an object {type:"dict",itemType:"foo"}
		schema: {
			required: true,	
		},

		settings: {
			required: true,
			type: Object
		}
	}
})