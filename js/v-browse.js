function createEmptyFilter() {
	return {
		before: undefined,
		after: undefined,
		dateMode: false,
		author: undefined,
		language: "any",
		languageVersion: "any",
		tags: [],
	}
}



// modify a filter in place, as a v-model?
Vue.component("filter-widget", {
	template: `<div class="">
		
		<table class="inlineblock">
			<tr><td class="ui-label">Author:</span></td><td><input v-model="value.author" /></td></tr>
			<tr><td class="ui-label">Tags:</span></td><td><input v-model="tags" /></td></tr>
			<tr><td class="ui-label">Language:</span></td>
				<td><select v-model="language">
					<option v-for="lang in filterOptions.language">{{lang}}</option>
				</select></td>
			</tr>
		</table>
		<table class="inlineblock">
			<tr><td class="ui-label">Date:</td><td><button @click="value.dateMode=!value.dateMode">{{dateModeDisplay}}</button></td></tr>
			<tr><td class="ui-label">from:</td><td>
				<vuejsDatepicker v-model="value.after" :clear-button="true"  :disabledDates="{from:value.before}" :use-utc="true"  />
			</td></tr>
			<tr><td class="ui-label">to:</td><td>
				<vuejsDatepicker v-model="value.before" :clear-button="true"  :disabledDates="{to:value.after}" :use-utc="true"  />
			</td></tr>
			
		</table>
		<div class="ui-controlbar">
			<span class="ui-label">Sort by: </span><select><option v-for="sortOption in sortOptions">{{sortOption}}</option></select><button class="toggle-button" @click="reverseSort=!reverseSort">{{sortDirectionIcon}}</button>
			<button class="svg-button">🔎</button>
		</div>
	</div>`,
	computed: {
		dateModeDisplay() {
			if (this.value.dateMode === false) 
				return "modified on"
			return "created on"
		},
		sortDirectionIcon() {
			if (this.reverseSort)
				return "▲"
			return "▼"
		},
		tags: {
			set(val) {
				this.value.tags = val.split(",").map(s => s.trim())
			},
			get() {
				return this.value.tags.join(", ")
			}
		},
		language: {
			set(val) {
				if (val === "any") {
					this.value.language = undefined
					this.value.languageVersion = undefined
					return
				}
				let s = val.split(" ")
				this.value.language = s[0]
				this.value.languageVersion = s[1]
			},
			get() {
				if (this.value.language === undefined && this.value.languageVersion === undefined)
					return "any"
				let s = this.value.language
				if (this.value.languageVersion === undefined)
					s += " " + this.value.languageVersion
				return s
			}
		}
	},
	data() {
		return {
			sortOptions: ["popularity", "likes",  "complexity", "title", "author", "date",],
			filterOptions: {
				language: ["any", "tracery", "tracery 1.0", "tracery 2.0", "chancery", "greenery"],
			},
			reverseSort: false,
		}
	},
	props: ["value"],
	components: {
		vuejsDatepicker
	}
})

// Search and display some set of bots
// It may have a filter that is either passed in as a prop or constructed

Vue.component("content-browse", {
	template: `<div class="column-content content-browse">
		<h3 v-if="settings.title">{{settings.title}}</h3>
		<selector-set v-if="!defaultFilter" :options="sourceOptions" v-model="selectedSource" />
		
		<filter-widget v-if="showFilterWidget" :value="customFilter" />

		
		
		<div class="scrollable">

			<div v-if="results.length === 0" class="ui-warning">No bots found!</div>
			
			<bot-preview 
				v-for="metadata in results" 
				@removedBot="removeBot" 
				@setToEdit="selectedSource='my bots'"
				:editMetadata="false" 
				:key="metadata.uid" 
				:metadata="metadata" />
		
		</div>
	</div>`,
	watch: {
		filter() {
			this.search()

		}
	},
	mounted() {
		this.search()
	},

	computed: {
		defaultFilter() {
			if (this.settings) {
				return this.settings.filter
			}
			return {

			}
		},
		showFilterWidget() {
			return this.defaultFilter === undefined && this.selectedSource && this.selectedSource.showFilterWidget
		},
		filter() {
			if (this.selectedSource) {
				return this.selectedSource.getFilter()
			}
			return this.defaultFilter
		}
	},

	methods: {
		removeBot(metadata) {
			let index =this.results.indexOf(metadata)
			this.results.splice(index, 1)
		},
		setSource(sourceName) {
			this.customFilter.source = sourceName
		},
		sort() {
			console.log("Sort results", this.results)
			this.results.sort((a, b) => b.modifiedOn - a.modifiedOn)
		},
		search() {
			this.isSearching = true
			app.setStatus("Searching...")
			
			io.getBotMetadata(this.filter)
			.then((results) => {

				console.log("RESULTS", results)
				this.results = results
				this.sort()
			})
			.then(() => {
				app.setStatus(`Found ${this.results.length} bots...`)
			}).catch((err) => {
				if (err && err.partialResults) {
					console.warn(err.err, err.partialResults)
					this.results = err.partialResults
					app.setStatus(err.err, "error")
				} else {
					console.warn(err)
				}
			})
		}
	},
	data() {
	
		let options = [{
			label: "cloud", 
			showFilterWidget: true,
			getFilter: () => {

				return {
					sources: {
						cloud: true,
					},
					conditions: {
						isPublished: true
					}
				}
			}
		},{
			label: "my bots", 
			getFilter: () => {
				return {
					sources: {
						local: true,
						cloud: true,
					},
					conditions: {
						isOwned: true
					}
				}
			}
		},{
			label: "examples", 
			getFilter: () => {
				return {
					sources: {
						examples: true,
					}
				}
			}
		}]
		return {
			sourceOptions: options,
			selectedSource: options[2],
			customFilter: createEmptyFilter(),
			results: [],
		}
	},
	props: {

		settings: {}

	}
})