

Vue.component("bot-preview", {
	template: `<div class="bot-preview" @click="selectBot" @dblclick="editBot" :class="{selected:isSelected}">
		<div class="bot-data">
			<header class="header">
				<div class="titledata">
					<div class="locationdata">
						<img v-if="locationIcon" :src="locationIcon" />
						<span class="title">{{metadata.title}}</span>
					</div>
					<div class="date" v-if="metadata.location!=='examples'">{{modifiedOn}}<span v-if='modifiedOn !== createdOn'> (created:{{createdOn}})</span></div>
				</div>

				<div class="controls">
					<div class="editdata">
						
					</div>

					<div class="languagedata">
						<img :src="languageIcon">
						<div class="ui-ultradetail">{{metadata.languageVersion}}</div>
						
					</div>
				</div>

			</header>
			
			<div class="controls">
				<div v-for="button in buttonSet" class="tooltip" :key="button.icon">
					<button @click.stop="doAction(button.action)" class="svg-button" :class="{inactive:button.inactive}"><img :src="button.icon" /></button>
					<span class="tooltiptext">{{button.tooltip}}</span>
				</div>

				<div class="row">
					<div v-if="metadata.import && metadata.import.length > 0">
						<span class="ui-uid">{{metadata.import[0].uid}}</span>
					</div>
				</div>
				
			</div>

				<table v-if="metadata.location=='cloud' && !isOwned">
				
						<td class="ui-label">author:</td>
						<td class="ui-value">{{metadata.authorID}}</td>
					</tr>
				</table>

			<div class="tags" style="text-align:center">
				<div class="tagholder">	
					<div class="ui-tile" v-for="tag in tags">{{tag}}</div>
					<div class="ui-subtle" v-if="tags.length === 0" >no tags</div>
				</div>
				
			</div>

			<div class="desc">
				<div class="ui-desc">
					{{metadata.desc}}
					<div class="ui-subtle" v-if="metadata.desc===undefined || metadata.desc.trim().length===0">
						no description
					</div>
				</div>
				
			</div>
		</div>

	</div>`,
	watch: {
		metadata() {
			if (this.metadata.import === undefined)
				Vue.set(this.metadata, "import", [])
			if (this.metadata.tags === undefined)
				Vue.set(this.metadata, "tags", [])
		}
	},
	computed: {
		hasSheets: {
			get() {
				return this.metadata.import && this.metadata.import.length > 0
			},
			set(val) {
				if (val)
					Vue.set(this.metadata, "import",[{
						type: "googleSheet",
						uid: "",
						overwrite: true
					}])
				else {
					Vue.set(this.metadata, "import",[])
				}
			}
		},
		
		tags() {
			if (!this.metadata.tags)
				return []
			return this.metadata.tags.filter(s => s.trim().length > 0)
		},
		tagText: {
			get() {
				if (this.metadata.tags === undefined)
					return []
				return this.metadata.tags.join(",")
			},
			set(val) {
				this.metadata.tags = val.split(",")
			}
		},

		buttonSet() {
			// Create the set of buttons needed by this bot
			let buttons = []
			if (this.isOwned) {
				buttons.push({
					icon: "css/icon/delete.svg",
					action: "delete",
					tooltip: "delete this bot"
				})
			}
			if (this.metadata.location === "cloud") {
				
				if (this.isOwned) {
						buttons.push({
						icon: "css/icon/download.svg",
						action: "download",
						tooltip: "download a copy of this bot to your local storage"
					})

					buttons.push({
						inactive: !this.metadata.isPublished,
						icon: "css/icon/cloud-showsrc.svg",
						action: "togglePublish",
						tooltip: "allow other people to see this bot"
					})
				}
			}

			if (this.metadata.location === "local") {
				buttons.push({
					action: "upload",
					icon: "css/icon/upload.svg",
					tooltip: "upload a copy of this bot to the cloud"
				})
			}
			return buttons
		},

		isOwned() {
			return io.isOwned(this.metadata)
		},
		modifiedOn() {

			return toDisplayDate(this.metadata.modifiedOn)
		},
		createdOn() {
			return toDisplayDate(this.metadata.createdOn)
		},
		
		
		languageIcon() {
			let icon = this.metadata.language
			if (this.metadata.language !== "chancery" && this.metadata.language !== "tracery")
				icon = "unknown"
				return "css/icon/language-" + icon + ".svg"	
		},
		locationIcon() {
			let icon = this.metadata.location
				
			if (!this.isOwned)
				return undefined

			return "css/icon/" + icon + ".svg"	
		},
		isSelected() {

			return app.bot.metadata.uid === this.metadata.uid
		},
	},
	methods: {
		
		
		doAction(action) {
			console.log("action:", action)
			switch(action) {
				case  "togglePublish":
					Vue.set(this.metadata, "isPublished", !this.metadata.isPublished)
					console.log("Publish", this.metadata.uid,this.metadata.isPublished )
					io.updateMetadata(this.metadata, ["isPublished"])
					break;
				case  "download":
					io.createAndSaveLocalCopy(this.metadata)
					break;
				case  "delete":
					console.log("DELETE", this.metadata.uid)
					io.deleteBot(this.metadata).then(() => {
						this.$emit("removedBot", this.metadata)
					})
					break;
				case  "upload":
					// TODO: upload
					io.createAndSaveCloudCopy(this.metadata)
					break;
				
			}
		},
		


		selectBot() {
			app.loadBot(this.metadata)
		},
		editBot() {
			app.editBot(this.metadata)
		},

	},

	created() {
		if (this.metadata.desc === undefined) {
			Vue.set(this.metadata, "desc", "")
		}
	},
	data() {
		return {
		
		}
	},
	props: ["metadata"]
})

