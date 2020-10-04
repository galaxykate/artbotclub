// Create an interactive status view of a chancery pointer

function ChanceryPointerUI(holder, ptr) {
	this.ptr = ptr;

	this.row = createRow({
		holder: holder,
		classes: "chancery-exitstatus"
	})

	this.id = $("<div/>", {
		html: ptr.id,
	}).appendTo(this.row.label)


	this.state = $("<div/>", {
		html: ptr.state.id,
		class: "chancery-ptrstate"
	}).appendTo(this.row.label)


	this.status = $("<div/>", {
		html: ptr.status + ":" + pointerStatusLabels[ptr.status],
	}).appendTo(this.row.label)


	// Status clock
	// Click to do different things depending on the status
	this.statusTimer = $("<div/>", {
		class: "timer",
	}).css({
		//"background": "conic-gradient(#f06, gold);",
		//"background": "hsla(0, 0%, 0%, .9)",
		"background": "conic-gradient(" + pctToGradient(.75) + ")"
	}).appendTo(this.row.label).click(() => {
		switch (ptr.status) {
			case 0: // enter state
				break;
			case 1: // do state+tag enter actions	
				break;
			case 2: // update
				if (tuning.requireUserActionToExit && ptr.activeExit) {
					ptr.exitStatus();
				}
				break;
			case 3: // enter exit
				break;
			case 4: // do exit actions
				break;
			case 5: // do state+tag exit actions

				break;
		}

	})


	ptr.on("selectExit", () => {
		// Highlight the selected exit
		let exit = this.exitMap.filter(e => e.ew.exit === ptr.activeExit.exit)[0]

		this.row.content.find(".chancery-exit").removeClass("chancery-exitselected")
		exit.row.addClass("chancery-exitselected")
	})


	ptr.on("updateStatusPct", (pct) => {
		this.statusTimer.css({
			"background": "conic-gradient(" + pctToGradient(pct) + ")"
		})
	})
	ptr.on("updateExit", (exitWatcher, exitIndex) => {

		this.exitMap[exitIndex].update()
	})



	ptr.on("enterStatus", () => {
		this.status.html(ptr.status + ":" + pointerStatusLabels[ptr.status])

		this.row.content.html("");

		switch (ptr.status) {
			case 0: // enter state
				this.state.html(ptr.state.id)
				break;
			case 1: // do state+tag enter actions	
				this.showActions()

				break;
			case 2: // update

				// Exit watchers
				this.exitMap = ptr.exitMap.map((exitWatcher) => {
					return new ChanceryExitWatcherUI(this.row.content, exitWatcher);
				})
				break;
			case 3: // enter exit

				break;
			case 4: // do exit actions
				this.showActions()
				this.exitMap.forEach(e => {
					if (e.ew.exit === ptr.activeExit.exit) {

					} else {
						e.row.slideUp();
					}
				})


				break;
			case 5: // do state+tag exit actions
				this.showActions()
				break;
		}
	})

}

ChanceryPointerUI.prototype.showActions = function() {
	let actions = this.ptr.actions.map(action => {
		return ChanceryActionUI(this.row.content, action)
	})

	if (actions.length === 0)
		this.row.content.html("(no actions)");
}

function ChanceryExitWatcherUI(holder, ew) {
	this.ew = ew;
	this.row = createRow({
		holder: holder,
		label: ew.id,
		classes: "chancery-exit",
		html: ew.exit.raw
	})

	// create the conditions
	this.conditions = ew.conditionMap.map(cw => {
		return {
			pill: new FillPill(this.row.content, "chancery-exp-" + cw.condition.type, cw.condition.raw, true),
			cw: cw,
		}

	})

	this.target = new FillPill(this.row.controls, "", "➜" + ew.exit.target.raw, true);
}

ChanceryExitWatcherUI.prototype.update = function() {

	this.conditions.forEach(condition => {
		condition.pill.setFill(condition.cw.pct)
	})

	if (this.isOpen !== this.ew.isOpen) {

		this.isOpen = this.ew.isOpen
		if (this.isOpen) {
			this.row.addClass("chancery-exitopen")
		} else {
			this.row.removeClass("chancery-exitopen")
		}
	}

}


function ChanceryActionUI(holder, action) {
	this.action = action;
	this.row = createRow({
		holder: holder,
		classes: "chancery-action",

	})

	expressionToDiv(this.row.content, action.template, false);

	let v = action.value
	if (typeof v === "number")
		v = v.toFixed(2)
	this.row.controls.append("<span class='chancery-actionvalue'>(" + v + ")</span>")

}

function pctToGradient(pct) {
	let colors = []
	let slices = 14;
	for (var i = 0; i < slices; i++) {
		if (pct < i / slices)
			colors[i] = "white"
		else
			colors[i] = "black"
	}
	return colors.join(",");

}