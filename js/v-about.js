// Front page

Vue.component("content-about", {
	template: `<div class="content-about">
		<h3>Welcome to ArtBot.club</h3>
		<div>
			<p><b>Artbot.club</b> is a place for anyone to explore bot-making.  You can <a href="?mode=browse">browse</a> bots that others have made, or try <a href="?mode=edit">making</a> your own.  No account is required to browse bots or to create a bot that is locally stored on your own computer, although you need to create an account to share your bot with others or comment on their bots.</p> 
			<p>Tracery was created in 2014 by Kate Compton <a href="www.galaxykate.com">galaxykate</a> as a tool to tell generated stories.  Since then, it has grown into a phenomena driven by writers using it to create surreal worlds, political bots, generative games, abstract artwork, and more.</p>
			</p>
		</div>

		<!-- action items --> 
		
		<div class="action-buttons">
			<button>try out the editor</button>
			<button>create an account</button>
			<button>learn more about Tracery and Chancery</button>
			<button>see what others have created</button>
			
		</div>

		

	</div>`,

	mounted() {
	
	},

	data() {
		return {
			results: []
		}
	}
})