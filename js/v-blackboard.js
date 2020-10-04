// Vue.component("content-blackboard-obj", {
// 	template: `<div v-if="node.type ==='dict'"  class="blackboard-node blackboard-dict">
// 		<div v-for="(item, itemKey) in node.properties"  class="blackboard-row">
// 			<div>{{itemKey}}:</b></div>
// 			<div><content-blackboard-obj :node="item" :index="itemKey" /></div>
// 		</div>
// 	</div>
// 	<div v-else-if="node.type ==='array'" class="blackboard-node blackboard-array">
// 		<div v-for="(item, itemKey) in node.properties" class="blackboard-item">
			
// 			<content-blackboard-obj :node="item" :index="itemKey" /></td>
// 		</div>
// 	</div>
// 	<div v-else class="blackboard-node blackboard-value">
// 		{{node.value}}
// 	</div>`,
// 	props: ["index", "node"]
// })
Vue.component("content-blackboard", {
	template: `<div class="blackboard">
		BLACKBOARD

		<value-editor 
			:object="blackboard" index="root" schema="bbNode" :settings="ui" 
		/>

		
	</div>`,
	//<content-blackboard-obj v-if="false" :node="blackboard.values" :index="'--root--'" />
	mounted() {

		let randomEntry = ()=>{
			let path = []
			path.push(utilities.getRandom(utilities.words.places.slice(0,3)))
			if (Math.random() > .1) {
				path.push(utilities.getRandom(utilities.words.animals.slice(0,3)))
			
				if (Math.random() > .1) {
					path.push(Math.floor(Math.random()*3))
					if (Math.random() > .1) 
					
						path.push(utilities.getRandom(utilities.words.material.slice(0,3)))
				}
			}
			this.blackboard.setAtPath(path, utilities.getRandom(utilities.words.moods.slice(0,3)) + Math.floor(Math.random()*100))

		}
		// for (var i = 0; i < 20; i++) {
		// 	randomEntry()
		// }

		for (var i = 0; i < 20; i++) {
			this.blackboard.setAtPath(["midi",i], 0)
		}


		console.log(this.blackboard.toCondensed())
		

		// setInterval(() => {
		// 	let t = Date.now()*.00001
		// 	for (var i = 0; i < 20; i++) {
		// 		this.blackboard.setAtPath(["midi",i], utilities.noise(i, t))
		// 	}
		// }, 500)
	},

	data() {
		return {
			ui: app.ui,
			blackboard: app.chanceryInstance.blackboard
		}
	}
})