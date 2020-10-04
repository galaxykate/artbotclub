Vue.component("content-animation", {
	template: `<div></div>`,


	mounted() {
		utilities.createProcessing({element:this.$el, 
			onUpdate:() => {
			}, 
			onDraw:(g, t) => {
				g.fill(0, 0, 0)
				g.ellipse(0, 0,100, 100);
				this.face.draw(g, t)
			}
		})

	},
	data() {
		return {
			face: new Face()
		}
	}
})

Vue.component("content-exitMap", {
	template: `<div>exit map</div>`
})




Vue.component("content-stateMap", {
	template: `<div>state map</div>`
})



Vue.component("content-chat", {
	template: `<div>chat</div>`
})
