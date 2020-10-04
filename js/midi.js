// use this to write to the current bot's blackboard

let sliderboard = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]

function setSlider(index, value) {
	sliderboard[index] = value
	if (app.bot.data.midiMapping) {
		// Also update the midi-mapped values
		let bbKey = app.bot.data.midiMapping[index]
		app.bot.blackboard.setPath(bbKey)
	}
}


function midiInit() {

	for (var i = 0; i < 10; i++) {
		let node = app.chanceryInstance.blackboard.getNodeAtPath(["midi", i], "unit")
		node.displayType = "pct"
		app.chanceryInstance.blackboard.setAtPath(["midi", i], .5)
	}

	setTimeout(() => {
		for (var i = 0; i < 10; i++) {
			let node = app.chanceryInstance.blackboard.getNodeAtPath(["midi", i], "unit")
			node.displayType = "pct"
			app.chanceryInstance.blackboard.setAtPath(["midi", i], .5)
		}
	}, 1000)

	// setInterval(() => {
	// 	for (var i = 0; i < 1; i++) {
	// 		let val = .5+ .5*utilities.noise(i, Date.now()*.0005)
	// 		val = utilities.sCurve(val, 2)
	// 		app.chanceryInstance.blackboard.setAtPath(["midi", i], val)
	// 	}				
	// }, 400) 
	
}

console.log("MIDI")
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
    .then((midiAccess) => {
			console.log(midiAccess);

			var inputs = midiAccess.inputs;
			var outputs = midiAccess.outputs;
			console.log(inputs);
			for (var input of midiAccess.inputs.values()) {

				console.log("input: ", input)
				input.onmidimessage = (midiMessage) => {

					console.log("message", midiMessage.data);
					let index= midiMessage.data[1]
					index = (index)%8
					let val = midiMessage.data[2]/128
					sliderboard[index] = val

					// let node = app.chanceryInstance.blackboard.getNodeAtPath(["midi", index], "unit")
					// node.displayType = "pct"
					app.chanceryInstance.blackboard.setAtPath(["midi", index], val)
					
					// console.log(sliderboard)
				}
			}


		}, () => {
    	console.log('Could not access your MIDI devices.');

    });
} else {
    console.log('WebMIDI is not supported in this browser.');
}