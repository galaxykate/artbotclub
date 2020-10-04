// View of a bot
// The mini view is in a window

function ChanceryUIMini(miniHolder, chancery) {
	// Show all pointers and their exits
	let div = $("<div/>", {

	}).appendTo(miniHolder);



	let mapViews = chancery.maps.map((map) => {
		let mapdiv = $("<div/>", {
		}).appendTo(div);
		if (map.id)
			map.div.html(map.id)
		let ptrViews = map.pointers.map((ptr) => {
			return new ChanceryPointerUI(mapdiv, ptr);
		})
	})

	chancery.on("addPointer", () => {
		console.log("TODO ADD POINTER")
	})

}
