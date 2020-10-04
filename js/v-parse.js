const componentProps = {template:{required:true,type:Object},node:{type:Object}, settings:{}}


Vue.component("ery-component-number", {
	template: `<div class="erycomponent erycomponent-number">NUMBER:{{template}}</div>`,
	props:componentProps
})

Vue.component("ery-component-error", {
	template: `<div class="erycomponent erycomponent-error">{{template.error}}</div>`,
	props:componentProps
})

Vue.component("ery-component-rg", {
	template: `<div class="erycomponent erycomponent-rg">
		<div v-if="template.rgType === 'array'">
			<ery-component v-for="(rule,ruleIndex) in template.rules"
				:template="rule"
				:key="ruleIndex"
				:settings="settings"
			/>
		</div>
		<div v-else class="ui-error">
			rgType:{{template.rgType}}
		</div>
	</div>`,
	props:componentProps
})
Vue.component("ery-component-expression", {
	template: `<div class="erycomponent erycomponent-expression">{{template.raw}}</div>`,
	props:componentProps
})

Vue.component("ery-component-text", {
	template: `<div class="erycomponent erycomponent-text">{{template.raw}}</div>`,
	props:componentProps
})


Vue.component("ery-component-key", {
	template: `<div class="erycomponent erycomponent-key" :class="{['erycomponent-context-' + template.context]:true}" >
			<ery-component :template="section" :settings="settings"   v-for="(section,index) in template.sections" :key="index" />
	</div>`,
	computed: {
		entry() {
			console.log("get key", this.template.raw)
			return app.keyData.getKeyEntry({dictKey:"grammar", key:this.template.raw})
		},
		
	},
	props:componentProps
})


Vue.component("ery-component-stackAction", {
	template: `<div class="erycomponent ery-component-stackAction" :style="style" :class="{['erycomponent-source-' + sourceType]:true}">
		<div class="header" v-if="settings.detailView">{{template.raw}}</div>
		<div class="content">
			<div class="section"><div v-if="settings.detail" class="label">source</div>
				<div><ery-component :template="template.source" :settings="settings" /></div>
			</div>
			<div class="op">:</div>

			<div class="section"><div v-if="settings.detail" class="label">rules</div>
				<ery-component :template="template.ruleGenerator" :settings="settings" />
				
			</div>
		</div>
	</div>`,
	computed: {
		sourceType() {
			if (this.entry === undefined) {
				if (this.template.source.isDynamic) {
					return "dynamicKey"
				}
				return "missingKey"
			}
			return "key"
		},
		entry() {
			return app.keyData.getKeyEntry({dictKey:"grammar", key:this.template.source.raw})
		},
		style() {
			return app.keyData.getKeyStyle(this.entry)
		}
	},
	props:componentProps
})

Vue.component("ery-component-socket", {
	template: `<div class="erycomponent erycomponent-socket" :style="style" :class="{['erycomponent-source-' + sourceType]:true}">
		<div class="header" v-if="settings.detailView">{{template.raw}}</div>
		<div class="content">
			<div class="section"><div v-if="settings.detail" class="label">source</div>
				<div><ery-component :template="template.source" :settings="settings" /></div>
			</div>

			<div class="section"><div v-if="settings.detail" class="label">mods</div>
			
				
				<div class="section" v-for="mod in template.mods"
					>
					<div class="op">.</div>
					<ery-component 
						:template="mod" 
						:settings="settings" />
				</div>
			</div>
		</div>
	</div>`,
	mounted() {
		console.log("Mods", this.template.mods)
	},
	computed: {

		sourceType() {
			if (this.entry === undefined) {
				if (this.template.source.isDynamic) {
					return "dynamicKey"
				}
				return "missingKey"
			}
			return "key"
		},
		entry() {
			return app.keyData.getKeyEntry({dictKey:"grammar", key:this.template.source.raw})
		},
		style() {
			return app.keyData.getKeyStyle(this.entry)
		}
	},
	props:componentProps
})

Vue.component("ery-component-rule", {
	template: `<div class="erycomponent erycomponent-rule">
		<div class="header" v-if="settings.detailView">{{template.raw}}</div>
		<div class="content">
			<ery-component v-for="(section,sectionIndex) in template.sections" :key="sectionIndex" 
					:template="section" 
					:settings="settings" 
					:node="node?node.sections[sectionIndex]:undefined" />
		</div>
	</div>`,
	props:componentProps
})


Vue.component("ery-component", {
	template: `<div v-if="template.errors && template.errors.length > 0" class="erycomponent-error">
		<div class="header">{{template.raw}}</div>
		<component :is="'ery-component-' + template.type"  :settings="settings" :template="template" :node="node"/>
		<div 
			class="erycomponent-error-data ui-error" 
			v-for="(error,errorIndex) in template.errors"
			:key="errorIndex"
		>{{error}}</div>
	</div>
	<component v-else :is="'ery-component-' + template.type"  :settings="settings" :template="template" :node="node"/>
	`,
	mounted() {
		// console.log(this.template.type, this.template.context, this.template.raw)
	},
	props:componentProps
})