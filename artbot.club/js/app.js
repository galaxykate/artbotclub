let paused = false;
let pauseStart;

$(document).keyup(() => {
	console.log("KEYUP")
	paused = !paused;
	if (paused)
		pauseStart = Date.now();
})

let testChanceries = {};

for (var i = 0; i < 0; i++) {
	let title = utilities.words.getRandomTitle();
	let chancery = createRandomChancery();
	let id = toCamelCase(title);
	chancery.title = title;
	chancery.id = id;
	testChanceries[id] = chancery;

}

let room;
$(function() {

	let chanceries = mapObjectToArray(localChanceries, (c) => {
		return c
	})
	room = new Room(chanceries);

	room.createUI($("#main-cols"));
	room.getMessage({
		msg: "HELLO, WORLD"
	})



	// let count = 0;
	// setInterval(() => {
	// 	if (Math.random() > .5 && count < 10) {
	// 		let p = getRandom(participants).id;
	// 		// room.getMessage({
	// 		// 	from: p,
	// 		// 	channelType: "canvas",
	// 		// 	shape: {
	// 		// 		command: "ellipse",
	// 		// 		w: Math.random() * 100,
	// 		// 		h: Math.random() * 100,
	// 		// 		x: (Math.random() - .5) * 300,
	// 		// 		y: (Math.random() - .5) * 300,
	// 		// 	}
	// 		// })


	// 		room.getMessage({
	// 			from: p,

	// 			msg: "hello"
	// 		})
	// 		let p2 = getRandom(participants.filter(p2 => p2.id !== p)).id

	// 		// room.getMessage({
	// 		// 	from: p2,
	// 		// 	channelType: "canvas",
	// 		// 	shape: {
	// 		// 		command: "rect",
	// 		// 		w: Math.random() * 300,
	// 		// 		h: Math.random() * 100,
	// 		// 		x: (Math.random() - .5) * 300,
	// 		// 		y: (Math.random() - .5) * 300,
	// 		// 	}
	// 		// })

	// 		room.getMessage({
	// 			from: p2,
	// 			to: p,

	// 			msg: "hello, " + p
	// 		})
	// 	}
	// 	count++
	// }, 200);



});