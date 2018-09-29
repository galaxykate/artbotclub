// Channels
// Each channel needs to implement: createUI(holder), getMessage(data), on(event, fxn)


function createChannelCard(holder, type, id) {
	return createCard({
		holder: holder,
		title: type + ": " + id,
		classes: "channel-panel channel-" + type,
		id: "channel-" + id
	})
}


//============================================

function ChannelChat(id, room, data) {
	this.init(id, room, data);
	this.letterSpeed = 2;
	this.lineDelay = 100;
}

ChannelChat.prototype.createUI = function(holder) {
	this.ui = createChannelCard(holder, this.type, this.id)

	this.ui.messages = $("<div/>", {
		class: "chat-messageholder"
	}).appendTo(this.ui.content)
}



ChannelChat.prototype.doTask = function(task) {


	task.time = task.line.length * this.letterSpeed * 1.5 + this.lineDelay;
	this.addBubble(task.line, task.data)
}


ChannelChat.prototype.addBubble = function(line, data) {
	if (this.ui) {

		

		let source = data.from ? this.room.participants[data.from].p : undefined;
		let target = data.to ? this.room.participants[data.to].p : undefined;
		let useVoice = source && source.voice && data.useVoice;
		let letterSpeed = (useVoice && source.voice.letterSpeed) ? source.voice.letterSpeed : this.letterSpeed;


		// Create the row and the bubble
		let row = $("<div>", {
			class: "chat-row"
		}).appendTo(this.ui.messages)
		if (source)
			sourceDiv = $("<div>").appendTo(row)
		if (target) {
			row.append("➜")
			targetDiv = $("<div>").appendTo(row)
		}
		let bubble = $("<div>", {
			class: "chat-bubble mini",
		}).appendTo(row)

		if (data.isDebugOutput) {
			row.addClass("debug")
		}

		// increase the bubble size and scroll to the top
		setTimeout(() => {
			bubble.removeClass("mini")
			this.ui.messages.scrollTop(this.ui.messages[0].scrollHeight - 90);

		}, 10)



		// Iterate through all the characters 
		if (this.letterSpeed !== undefined) {
			let letterIndex = 0;
			let charTimer = setInterval(() => {
				bubble.append(line[letterIndex])
				letterIndex++;
				if (letterIndex > line.length) {
					clearInterval(charTimer);
				}
			}, this.letterSpeed)
		} else {
			bubble.html(line)
		}



		if (source) {
			let side = source.side || "left"
			if (source.isBot) {
				side = "right"
			}

			// Speak in the sources voice
			if (useVoice) {
				this.isBusy = true;
				let voiceType = source.voice.voiceType || "UK English Male";
				row.addClass(side);
				responsiveVoice.speak(line, voiceType, {
					rate: 1.2,
					onstart: () => {

					},
					onend: () => {
						// Finished talking
						this.isBusy = false;
						this.dequeueMsg();
					}
				});
			}


			room.setToChiclet(sourceDiv, source)

		} else {
			row.addClass("center")
		}

		if (target) {
			room.setToChiclet(targetDiv, target)
		}

	}


}


function ChannelChancery(id, room, data) {}

function ChannelBlackboard(id, room, data) {}

function ChannelHTML(id, room, data) {}

function ChannelControl(id, room, data) {
	this.init(id, room, data);
}

ChannelControl.prototype.createUI = function(holder) {

	this.ui = createChannelCard(holder, this.type, this.id)
	this.ui.addClass("channel-control-" + this.data.target.type)
	this.data.target.createControls(this.ui.content);
}

//=============================

function ChannelCanvas(id, room, data) {
	this.init(id, room, data);
}



ChannelCanvas.prototype.createUI = function(holder) {
	this.ui = createChannelCard(holder, this.type, this.id)

	utilities.createProcessing(this.ui.content, (t, g) => {

	}, (g) => {

	}, (g) => {
		this.g = g;
		g.pushMatrix()
		g.translate(g.width * .5, g.height * .5)
	})
}

ChannelCanvas.prototype.finishMsg = function(msg) {
	this.room.getMessage({
		from: this.id,
		msg: msg.from + " drew a thing!"
	})
}

ChannelCanvas.prototype.doTask = function(task) {
	task.result = "drew " + task.name
	task.time = 500;

	let s = task.shape;

	let id = task.ownerID;
	let owner = this.room.participants[id];
	let c = owner.idColor;

	let g = this.g;
	if (task.mode === "fill") {
		c.fill(g, -.2 + Math.random())
		g.noStroke();
	}


	if (task.mode === "stroke") {
		c.stroke(g, -.4 + .3 * Math.random())
		g.noFill();
	}

	g[s.command](s.x, s.y, s.w, s.h);

	c.fill(g, -.4)
	g.text(id, s.x + 50 + (70 * (-.5 + Math.random())), s.y + (70 * (-.5 + Math.random())));
}



//============================================
// Add handlers-adders/doers


const channelTypePrototypes = {
	blackboard: ChannelBlackboard,
	chancery: ChannelChancery,
	control: ChannelControl,
	canvas: ChannelCanvas,
	html: ChannelHTML,
	chat: ChannelChat,
}
Object.keys(channelTypePrototypes).forEach(key => {
	let proto = channelTypePrototypes[key].prototype;
	proto.do = doEventHandlers;
	proto.on = addEventHandler;

	proto.init = function(id, room, data) {
		this.id = id;
		this.room = room;
		this.data = data;
		this.type = key;
		this.msgQueue = [];

	}

	// Enqueue the message
	proto.getTasks = function(msg) {

		if (msg.msg) {


			return msg.msg.split("\n").map(msgLine => {

				return {
					data: msg,
					line: msgLine
				}
			});
		} else {

			// Drawing message
			if (msg.channelType === "canvas") {
				let shape2 = shallowCopyObj(msg.shape)
				shape2.w *= .8;
				shape2.h *= .8;

				return [{
					ownerID: msg.from,
					name: msg.shape.command + "0",
					shape: msg.shape,
					mode: "fill",
				}, {
					ownerID: msg.from,
					name: msg.shape.command + "1",
					shape: msg.shape,
					mode: "stroke"
				}, {
					ownerID: msg.from,
					name: msg.shape.command + "2",
					shape: shape2,
					mode: "fill"
				}, {
					ownerID: msg.from,
					name: msg.shape.command + "3",
					shape: shape2,
					mode: "stroke"
				}]
			} else {
				return []
			}

		}

	}

	// Enqueue the message
	proto.getMessage = function(data) {
		// Add this to the queue 
		this.msgQueue.push(data);

		this.dequeueMsg();
	}

	proto.dequeueMsg = function() {
		if (this.currentlyProcessingMessage !== undefined || this.isBusy) {
			//console.log(this.id + ": msg queue busy");
		} else {


			if (this.msgQueue.length > 0) {
				// Get the next message to process
				let msg = this.msgQueue.shift();
				this.currentlyProcessingMessage = msg;

				// Process if necessary
				if (this.processMsg)
					this.processMsg(msg);


				// Add any tasks
				let tasks = this.getTasks(msg);

				serialPromise(tasks, (task, resolve, reject) => {
					this.doTask(task);
					setTimeout(() => resolve(task.result), task.time);
				}, (results) => {
					this.currentlyProcessingMessage = undefined;
					if (this.finishMsg)
						this.finishMsg(msg);
					this.dequeueMsg();
				})


			}
		}
	}
});