let keyCount = 0
let keyDirectoryRefreshCount = 0

// Override saving
document.addEventListener("keydown", (e) => {
	// https://stackoverflow.com/questions/11112127/prevent-backspace-from-navigating-back-with-jquery-like-googles-homepage
	// if (e.which === 8 && !$(e.target).is("input:not([readonly]):not([type=radio]):not([type=checkbox]), textarea, [contentEditable], [contentEditable=true]")) {
	if (e.which === 8 && !$(e.target).is(".stringeditor, input, textarea")) {
		e.preventDefault();
	}

	if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
	
		io.saveBot(app.bot)


	}
}, false);

	

let statusCount = 0

let app = {
	// Flags and selected elements and such!
	ui: {
		schema: {
			bbNode: {
				id:"bbNode",
				type: "object",
				displayAsKey: ["props","items", "value"],
				props: [{
						key: "type",
						type: "string"
					},{
						key: "props",
						type: {
							type: "dict",
							itemType: "bbNode"
						}
					},{
						key: "items",
						type: {
							type: "array",
							itemType: "bbNode"
						}
					},{
						key: "value",
						type: "string",
					}]
			},
			key: {
				id:"key",
				type: "string",
			},
			ruleset:[{
				id:"single",
				type: "string",
				parseAs:"rule",
			},{
				id:"array",
				type: "array",
				itemType: "ruleset"
			},{
				id:"falldown",
				type: "object",
				props: {
					value: {type:"string", parseAs:"expression"},
					cases: {type:"dict", itemType:"ruleset"}
				}
			}]
		},
		selected: {},
		active: {}
	},
	tutorials: {
		sheets:{},
		basicTracery: {},
		tricksWithPushPop:{},
		basicChancery: {},
		chanceryAndGreenery: {}
	},
	keyData: new KeyData(),
	
	popupContent: undefined,

	chanceryInstance: new ChanceryInstance(),
	

	user: {
		uid: undefined,
		email: undefined,
		profile: undefined
	},
	
	selectedBot:undefined,
	bot: {
		metadata: undefined,
		data: undefined
	},
	mode: "about",
	status: {},
	setStatus(msg, type) {
		let id = statusCount++
		Vue.set(app, "status", {
			msg: msg,
			id: id,
			type:type
		})
		setTimeout(() => {
			if (app.status.id === id)
				app.status = undefined
		}, 2500)
	},


	setURL() {
		let title = 'artbot.club - ' + app.mode
		let params = `/?mode=${app.mode}`
		if (app.bot.metadata.uid) {
			title += `(${app.bot.metadata.uid})`
			params += `&bot=${app.bot.metadata.uid}`
		}
		
		window.history.pushState('artbot.club', title, params);
		
	},
	setMode(mode) {
		// Set the url and record this as the last mode
		// io.setLocal("lastAppMode", mode)
		app.mode = mode			
		app.setURL()

	},

	setMetadata(metadata) {
		Vue.set(app.bot, "metadata", metadata)
	},


	newBot() {
		let newBot = io.createEmptyLocalBot()

		app.loadBot(newBot.metadata, newBot.data).then(() => {
			// console.log("set to empty local bot", newBot.metadata.uid)
		})
	},

	playBot(metadata) {
		app.loadBot().then(() => {
			console.log("LOADED ", app.bot.metadata.title)
		}) 
		if (app.bot.metadata.lanuage === "chancery")
			app.setMode("gallery")
		else
			app.setMode("chancery")
		
	},

	editBot(metadata) {
		if (metadata)
			app.setMetadata(metadata)

		// Edit the current bot? 
		// Do we own it? If not make an editable copy
		metadata = app.bot.metadata
		if (!io.isOwned(metadata)) {
			let newBot = io.createLocalCopy(app.bot)


			app.loadBot(newBot.metadata, newBot.data).then(() => {
				// console.log("set to local clone bot", newBot.metadata.uid)
				io.saveBot()
			})
		} else {
			// console.log("Editing an owned bot")
		}
		app.setMode("edit")
	},

	loadBot(metadata, data) {

		if (metadata) {
			app.setMetadata(metadata)
		}

		console.log("\n===========================================================\nLoading:",app.bot.metadata.uid)

		if (data) {
			// Got pre-loaded data? Skip out of the whole loading process
			Vue.set(app.bot, "data", data)
			return Promise.resolve()
		}

		if (app.bot.metadata === undefined || app.bot.metadata.uid == undefined) {
			console.error("No metadata")
			return
		}

		// First, load the metadata if necessary, then load the rest of the bot's data
		return io.loadBotMetadata(app.bot.metadata).then(() => {
			// Cache the metadata
			io.setLocal("lastMetadata", app.bot.metadata)
			
			return io.loadBotData(app.bot.metadata).then(data => {
				if (data === undefined) 
					return Promise.reject(`No data found for bot '${app.bot.metadata.uid}'`)
				// Update the bot with the new data
				app.setBotData(data, "load")
			})
		})
	},

	setBotData(data, changeSource) {
		// Is this data a grammar-only CBDQ-style bot?
		// Or is it a complex bot like chancery 
		if (data.grammar === undefined) {
			Vue.set(app.bot, "data", {
				grammar: data
			})
		} else {
			Vue.set(app.bot, "data", data)
		}
		// successfully loaded bot
		// do anything else like pre-parsing or creating an instance		
		app.keyData.refreshKeyData(app.bot.data)	
	},
}

Vue.component("auth-widget", {
	template: `<div class="auth-widget">
		<div v-if="user.uid">
			<div class="ui-tiny">User:{{user.uid}}</div>
			<div class="ui-tiny">(profile names TBD!)</div>
			
			<button @click="io.signOut()">sign out</button>
		</div>
		<button v-else @click="app.popupContent='auth'">sign up</button>
	</div>`,
	data() {
		return {
			app: app,
			user: app.user,
			io: io
		}
	},
	
})

Vue.component("content-auth", {
	template: `<div id="firebaseui-auth-container"></div>`,
	mounted() {
		io.startAuthContainer("#firebaseui-auth-container")
	}
})

// App may have one of several built-in-modes
Vue.component("content-chancery", {
	template: `<div>chancery things</div>`
})




Vue.component("content-preview", {
	template: `<div class="content-preview">
		<header class="row">
			<span class="title">{{app.bot.metadata.title}}</span>
			<span class="language">{{app.bot.metadata.language}}</span>
			<span class="ui-miniuid">{{app.bot.metadata.uid}}</span>
			<div class="controls" v-if="app.bot.metadata.language!='tracery'">
				<button class='toggle-button' @click="chanceryPreview=!chanceryPreview">chancery</button>
			</div>

			<button class="svg-button" @click.stop="app.editBot()" v-if="app.mode !== 'edit'">
				<img src="css/icon/edit.svg" />
			</button>
			<button class="svg-button" @click.stop="app.playBot()" v-if="app.mode !== 'play'">
				<img src="css/icon/play.svg" />
			</button>
		</header>
		<div class="error" v-if="app.bot.data === undefined">ERROR: Bot loading...</div>
		<tracery-preview v-else-if="!chanceryPreview" />
		<chancery-sim v-else />
		

	</div>`,
	data() {return {
		chanceryPreview: false,
		app:app
	}}
})


// App may have one of several built-in-modes
Vue.component("content-user", {
	template: `<div>
		<h3>User profile</h3>
		<div class="ui-ultradetail">under construction!</div>
		<div class="panel">
			<table>
				<tr>
					<td class="ui-label">Username:</td>
					<td>
						<input v-if="editMode" v-model="user.username">
						<div v-else>{{user.username}}</div>
					</td>
				</tr>
				<tr>
					<td class="ui-label">Display name:</td>
					<td>
						<input v-if="editMode" v-model="user.displayname">
						<div v-else>{{user.displayname}}</div>
					</td>
				</tr>
			</table>
		</div>

		<div class="panel">
			<div class="ui-subtle">no messages</div>
		</div>

	</div>`,
	computed: {
		user() {
			return app.user
		},
		editMode: {
			get() {
				return app.editUserMode
			},
			set(val) {
				 app.editUserMode = val
			}
		},
	},

})


Vue.component("content-dev", {
	template: `<div>
		<div>
			<div class="ui-tiny testbotdata">
				{{testBot}}
			</div>
			<div class="ui-status">{{status}}</div>

			<button :disabled="freezeControls" @click="rerollBot">🎲</button>
			<button :disabled="freezeControls" @click="addBot(true)">save bot to cloud</button>
			<button :disabled="freezeControls" @click="addBot(false)">save bot locally</button>
			
		</div>
	</div>`,
	computed: {
		freezeControls() {
			return this.status !== undefined
		}
	},
	methods: {
		rerollBot() {
			this.testBot = createTestBot()
		},
		addBot(toCloud) {
			
			if (toCloud) {
				this.testBot.metadata.location = "cloud"
				this.status = "saving to cloud...."
			
			} else {
				this.testBot.metadata.location = "local"
				this.status = "saving to local...."
				setTimeout(() => {this.status = undefined}, 1)
			}

			io.saveBot(this.testBot).then(() => {
				console.log("Finished saving to " + 	this.testBot.metadata.location, this.testBot.metadata.uid)
				this.status = undefined
			}) 
		}
	},
	data() {
		return {
			status: undefined,
			testBot: createTestBot()
		}
	}
})




new Vue({
	el: "#app", 
	template: `<div id="app" ref="app">
			<div id="app-header" v-if="showHeader">
				{{app.activeStringEditor}}
				<div class="app-logo">
					<img class="app-logo-hero" src="css/icon/artbotclub-small.png"/>
					<div class="app-logo-text">
						<div class="title">ArtBot.Club</div>
						<div class="subtitle">a place for bots</div>
					</div>
				</div>

				<div class="app-status">
					<span v-if="app.status" :class="'app-status' + app.status.type">{{app.status.msg}}</span>
				</div>
				<div class="app-nav">
						
					<button v-for="navbutton in navbuttons" 
						class="navbutton"
						:class="{selected:navbutton.mode===app.mode}"
						@click="navigateTo(navbutton)">{{navbutton.text}}</button>
					<div class="menu-holder" v-if="false">
						<div class="menu-top" @mouseenter="showMenu=true" @mouseleave="showMenu=false">
							tutorials ({{showMenu}})
							<ul id="tutorialmenu" v-show="showMenu">
								
								<li v-for="(tutorial,tutorialKey) in app.tutorials">
									<div>{{tutorialKey}}</div>
								</li>
							</ul>
						</div>
					</div>
				</div>

				<auth-widget />
			</div>
			<div id="app-content">
				<layout-main />
			</div>
			<div id="app-footer">


			</div>

			<div id="popup" v-if="app.popupContent!== undefined">
				<div id="popup-bg" @click="app.popupContent=undefined"></div>
				<div id="popup-panel">
					<component :is="'content-' + app.popupContent" />
				</div>
			</div>
		</div>`,
	
	watch: {
		"app.bot.data": function() {
			console.log("-------Bot data changed---------")
			app.keyData.refreshKeyData(app.bot.data)	
		}

	},
	
	mounted() {
		
		$( "#tutorialmenu" ).menu()

		// Get the URL search parameters.
		// Is there a bot id? what mode are we in?
		let path = window.location.pathname
		let params = new URLSearchParams(window.location.search);

		

		// Load the last bot
		let botUID = params.get("bot") 
		let lastMetadata = io.getLocal("lastMetadata")
			
		console.log("APP: Load a bot on mount")
		// Or get the last bot
		if (botUID) {
			console.log("APP: ....URL-specified bot uid", botUID)
			app.setMetadata({
				uid: botUID
			})
		}
		else if (lastMetadata) {
			console.log("APP: ....Load previous bot", lastMetadata.uid)
			app.setMetadata(lastMetadata)
		} else {
			console.warn("APP: ....Neither old bot or last bot, nothing selected!")
			app.setMetadata(exampleMetadata[0])
		}
		console.log("APP: Finished loading metadata for", app.bot.metadata.uid)
		app.loadBot().catch((err) => {
			console.warn(err)
		})
		
		let startMode = params.get("mode") || io.getLocal("lastAppMode") || "about"
		app.setMode(startMode)

		midiInit()

	},

	methods: {
		navigateTo(navbutton) {
			console.log("NAV", navbutton)
			if (navbutton.onEnter) 
				navbutton.onEnter()
			app.setMode(navbutton.mode)
		}

	},

	data: {

		navbuttons: [{
			text: "about",
			mode: "about"
		},{
			text: "create a new bot",
			onEnter: () => {
				app.newBot()
			},
			mode: "edit"
		},{
			text: "browse bots",
			mode: "browse"
		},{
			text: "dev mode",
			mode: "dev"
		},],
		showMenu: false,
		showHeader: true,
		app: app,
		io: io,
		
	}
}) 

