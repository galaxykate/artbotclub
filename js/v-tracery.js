


// Show and style some text
Vue.component('text-output', {
	template: `<div class="text-output" :style="textStyle" v-html="text"/>`,
	
	props: {
		text: {
			type: String, 
			required: true
		},
		textStyle: {
			type: Object, 
			required: false
		}
	}
})

Vue.component('tracery-preview', {
	template: `
	<div class="section">
		
		<header><div class="controls">
			<input v-model="seed">
			<select v-model='count'><option v-for="num in counts">{{num}}</option></select>
			<select v-model='origin'><option v-for="symbolKey in keys">{{symbolKey}}</option></select>

			<button class="svg-button" @click="randomize"><img src="../css/icon/randomize.svg"></button>
			
			<select v-model='origin'><option v-for="symbolKey in keys">{{symbolKey}}</option></select>

			<button class="toggle-button svg-button" @click="showNested=!showNested" :class="{active:showNested}"><img src="../css/icon/nested.svg"></button>
			<button class="toggle-button svg-button" @click="showCode=!showCode" :class="{active:showCode}"><img src="../css/icon/code.svg"></button>
		</div></header>

		<div class="content tracery-traces">
			<div v-for="trace in traces" :key="'trace' + trace.seed" class="tracery-trace">
				<header><div class="ui-miniuid">{{trace.seed}}</div></header>
				<ery-component v-if="showNested" :node="trace.root" :template="trace.root.template" />

				<div v-if="showCode" v-text="trace.root.finished" class="code"></div>
				<text-output v-else :textStyle="textStyle" :text="trace.root.finished"></text-output>
			</div>

		</div>
	</div>`,

	watch: {
		raw: {
			deep: true,
			handler() {
			
				if (this.raw[this.origin] === undefined) {
					// Invalid current origin?
					if (this.raw["origin"] !== undefined)
						this.origin = "origin"
					else
						this.origin = Object.keys(this.raw)[0]
				} else {
					// console.log(this.origin + "is fine")
				}
				
			}
		},
		showCode() {
			io.setLocal("showCode", this.showCode)
		},
		showNested() {
			io.setLocal("showNested", this.showNested)
		},
		seed() {
			io.setLocal("traceryPreviewSeed", this.seed)
		}
	},
	methods: {
		randomize() {
			this.seed = utilities.words.getRandomSeed()
		}
	},
	computed: {

		raw() {
			if (app.bot.data) {
				return app.bot.data.grammar
			}
			console.warn(" No grammar in data:", app.bot.data)
			return {}
		
		},
		textStyle() {
			// let style = "monospace"
			// return outputStyles[style]
		},
		keys() {
			if (!this.raw)
				return []
			return Object.keys(this.raw)
		},
		grammar() {
			// Parse this raw grammar
			return parseTraceryGrammar(this.raw)
		},
		context() {
			return tracery.createContext({grammar:this.grammar})
		},

		traces() {
			// Todo: set random as part of context
			Math.seedrandom(this.seed);
			let traces = []
			for (var i = 0; i < this.count; i++) {
				let seed = utilities.words.getRandomSeed(4)
				let trace = this.context.expand(`#${this.origin}#`)
				traces.push({
					seed: seed,
					root:trace
				})
			}

			// re-randomize
			Math.seedrandom(Date.now());
			

			return traces
		}
	},
	data() {
		return {
			seed: io.getLocal("traceryPreviewSeed")||utilities.words.getRandomSeed(),
			counts: [1, 5, 15, 25],
			showCode: io.getLocal("showCode"),
			showNested: io.getLocal("showNested"),
			count: io.getLocal("traceCount")|| 5,
			origin: "origin"
		}
	},
	props: {
	
	},
})