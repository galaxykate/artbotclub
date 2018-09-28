// Create an interactive status view of a chancery pointer

function ChanceryPointerUI(holder, ptr) {
	let section = createSection({
		holder: holder,
		title: ptr.id,
		classes: "chancery-ptr full-width"
	}, true);



	// let bbHolder = createSection({
	// 	holder: section.content,
	// 	title: "bb",
	// 	classes: "chancery-ptrbb full-width"
	// });

	let exitHolder = createSection({
		holder: section.content,
		title: "exits",
		classes: "chancery-ptrexits full-width"
	});

	let exitMapUI;



	function refreshExitMap(ptr) {
		// Clear
		exitHolder.content.html("");
		// Refresh all the exits
		exitMapUI = ptr.exitMap.map(exitWatcher => {

			let exitRow = exitToDiv(exitHolder.content, exitWatcher.exit, true)
			exitRow.holder.label.html(exitWatcher.label)
			//row.content.html()


			exitRow.bid = $("<div/>", {
				html: "bid",
				class: "chancery-exitbid"
			}).appendTo(exitRow.holder.controls);

			exitRow.goButton = $("<button/>", {
				html: "➜"
			}).appendTo(exitRow.holder.controls).click(() => {
				// use this exit
				ptr.selectExit(exitWatcher)
				ptr.activateExit()
			})
			return exitRow;
		})
	}



	refreshExitMap(ptr);



	let statusCount = 0;

	function setStatus(status) {
		section.subtitle.html(status);
		statusCount++;
		let statusID = statusCount;

		let time = status.length * 100 + 200;

		// Clear this status if no other status
		setTimeout(() => {

			if (statusCount === statusID) {
				section.subtitle.html("-");
			}
		}, 1000);
	}



	ptr.on("enterState", function(lastState) {
		if (this.state !== lastState) {
			refreshExitMap(this);
		} else {
			console.log("reenter state")
			// TODO: update the exit map
		}

	})
	ptr.on("updateExitMap", function(exit, index, conditionsChanged) {
		// When one of the exitmap conditions is changed
		exitMapUI[index].conditions.forEach((conditionPill, index) => {

			let conditionWatcher = exit.conditionMap[index];
			conditionPill.setFill(conditionWatcher.pct)
		})

		if (exit.isOpen) {
			exitMapUI[index].holder.addClass("chancery-exitopen")
		} else {
			exitMapUI[index].holder.removeClass("chancery-exitopen")
		}


	})

	ptr.on("setBid", function(exit, index) {
		let bid = exit.currentBid ? exit.currentBid.toFixed(2) : "--";

		exitMapUI[index].bid.html(bid);

	})

	ptr.on("activateExit", function(exit) {
		//console.log("ACTIVATE EXIT")

		setStatus("Activate exit " + exit.label)

	})
	ptr.on("selectExit", function(exit) {
		//console.log("SELECT EXIT")
		setStatus("Select exit " + exit.label)

	})


}