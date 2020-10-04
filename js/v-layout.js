// Layouts
// different urls open different layouts

//  artbot.club/edit
//  artbot.club/gallery
//  artbot.club/edit
//  artbot.club/gallery/?bot=sdfajsjdaf
//  artbot.club/about
//  artbot.club/tutorials/foo


// 
// 	what is in a layout?
//  left-and-right overlays, popup, main content, multiple sections

Vue.component("content-test", {
	template: `<div>
		<div  class="tooltip">
		<span class="tooltiptext">Lots of text here</span>test</div>
	</div>`,

	props: ["settings"]
})

// A column can have several content layouts, accessible by navigation tabs
//  Some of those may have multiple panels
Vue.component("layout-column", {
	template: `<div v-show="layout!==undefined" :id="label" :style="getStyle" class="column"  :class="{isCollapsed:isCollapsed,['column-' + label]:true}">
				
			<div class="column-header" v-if="hasHeader">
				
				<div v-if="!isCollapsed">
					<div class="navtabs" v-if="tabs.length > 1" >
						<div v-for="(tab,tabIndex) in tabs" 
							class="navtab":key="'tab-' + tab.id" 
							@click="selectedTab=tab" 
							:class="{selected:selectedTab===tab}"
							:style="{'z-index':((selectedTab===tab)?20:tabIndex+1)}" >
								{{tab.label}}
								<div class="ui-ultradetail" v-if="layout.sublabel">{{tab.sublabel}}</div>
							</div>

					</div>
				</div>
			</div>
			<div v-if="!isCollapsed" class="column-content" :style="{overflowY:'scroll'}" >
				
				<component 

					v-for="(content, contentIndex) in panels" 
					:is="'content-' + content.type" 
					:key="'panel' + content.type"
					class="panel" 
					:settings="content.settings"
					:ref="'panel-' + content.type" 
					:style="contentStyle(content, contentIndex)" />
				
				
			</div>

			<div class="column-resizehandle" ref="handle" :id="label + '-handle'" v-if="resizable"></div>
			
		</div>`,
	mounted() {
		// Make the sides draggable


		if (this.resizable) {
			$(this.$refs.handle).draggable({
				helper: () => "<div></div>",
				drag: (ev, ui) => {

					// Calculate the current width
					let pxSize = 0
					switch(this.label) {
						case "right": 
							let pxRight =  this.$el.offsetWidth + this.$el.offsetLeft
							pxSize = pxRight - ui.offset.left
							break;
						case "left": 
							
							pxSize = ui.offset.left
							break;
					}
					
					this.isCollapsed = pxSize < 200
					if (this.isCollapsed)
						pxSize = 20

					this.columnWidth = pxSize + "px"
					io.setLocal("columnWidth_" + this.label, this.columnWidth)
				}
			})
		}


	},
	methods: {
		contentStyle(content, contentIndex) {
			let s = {
				backgroundColor: content.settings.color,
				minHeight:30,
				height: content.settings.height,
				flex: content.settings.flex?1:undefined
			}


			if (content.settings.height !== undefined) {

			}
			return s
		
		}
	},
	watch: {
		panels: {
			handler() {

				// make the panels draggable 
				Vue.nextTick(() => {

					this.panels.forEach((panel) => {
						if (panel.settings.resizable) {

							// Reset the height to the stored height, if there is one
							let refID = "panel-" + panel.type
							let height = io.getLocal(refID)
							$(this.$refs[refID][0].$el).css({
								height: height + "px"
							})

							// Make this resizable
							$(this.$refs[refID][0].$el).resizable({
								minHeight: 40,
								handles: "s",
								resize(ev, ui) {
									io.setLocal(refID, ui.size.height)
								}
							})
						}
					})
				})
				
			}
		}
	},
	computed: {
		tabs() {
			
			return [this.layout]
		},
		panels() {
			if (this.layout === undefined)
				return []
			let panelData = this.tabs[0].map(section => {

				if (typeof section === "string") {
						let [type,...settingsData] = section.split(" ")
						section = {
							type:type,
							settings: {}
						}
						
						settingsData.forEach(setting => {
							let [prop,val] = setting.split(":")
							section.settings[prop] = val
						})
				}
				
				// Figure out which section is the edit stuff
				if (section.type === "edit2")
					section.type = "json"
				if (section.type === "edit1")
					section.type = "parse"

				return section
			})
		
			return panelData
		},
		resizable() {
			return this.label !=='center'
		},
		hasHeader() {
			return false
		},
		getStyle() {
			return {
				width: this.columnWidth
			}
		}
	},
	data() {
		return {
			minWidth: 50,
			isCollapsed: false,
			
			columnWidth: io.getLocal("columnWidth_" + this.label) || "200px"
		}
	},
	props: {
		label: {},
		layout: {}
	}
})

Vue.component("layout-main", {
	template: `<div class="layout-main" v-if="layout">
				
				<layout-column v-for="columnID in columns" :key="columnID" :label="columnID" :layout="layout[columnID]" />	
				
			</div>`,
	mounted() {	


	},
	computed: {
		layout() {
			if (!modeLayouts[app.mode])
				console.warn("No mode:", app.mode)
			return modeLayouts[app.mode]
		}
	},
	data() {
		return {
			columns: ["left", "center", "right"],
		}
	}
})


let modeLayouts =  {
	about: {
		center: ["about"],
		right: [{
			type:"browse", 
			settings: {
				title: "Most recent bots",
				filter: {
					sortBy: "modifiedOn",

				}
			}
		}]
	},
	edit: {
		left: ["keybrowser height:30% resizable:true", "edit1 flex:1"],
		// left: [],
		center: ["preview height:30% resizable:true",  "blackboard flex:1"],
		right: ["edit2 flex:1"]
	},
	chancery: {
		left: ["animation height:30% resizable:true", "blackboard flex:1"],
		center: ["chat"],
		right: ["stateMap height:30% resizable:true",  "exitMap flex:1"]
	},
	gallery: {
		center: ["gallery"],
	},
	browse: {
		center: ["preview height:30% resizable:true", "blackboard flex:1"],
		right: ["browse"]
	},
	dev: {
		center: ["preview"],
		right: ["dev"]
	}	
}