function FillPill(holder, classes, html, hasFill) {
	this.holder = $("<div/>", {
		class: "fillpill " + classes
	}).appendTo(holder);

	if (hasFill) {
		this.fill = $("<div/>", {
			class: "fillpill-fill"
		}).appendTo(this.holder);

		this.overlay = $("<div/>", {
			class: "fillpill-overlay",
			html: html
		}).appendTo(this.holder);

		this.label = this.overlay;
	} else {
		this.holder.html(html)
		this.label = this.holder;
	}
}

FillPill.prototype.setFill = function(pct) {
	if (this.fill)
		this.fill.css({
			width: pct * 100 + "%"
		})
	if (pct === 1) {
		this.holder.addClass("fillpill-max")
	} else
		this.holder.removeClass("fillpill-max")
}


function getRandom(arr) {
	return arr[Math.floor(arr.length * Math.random())]
}

function createRow(settings) {
	let row = $("<div/>", {
		class: "row " + (settings.classes ? settings.classes : ""),
		id: settings.id
	}).appendTo(settings.holder)

	let mainRow = row;
	// put it in a holder
	if (settings.topline) {
		row.topline = $("<div/>", {
			class: "topline",
			html: settings.topline
		}).appendTo(row)


		row.subrow = $("<div/>", {
			class: "subrow row"
		}).appendTo(row)

		
		row.addClass("duplexrow")

		mainRow = row.subrow;

	}

	row.prefix = $("<div/>", {
		class: "row-prefix",
		html: settings.prefix
	}).appendTo(mainRow)

	row.label = $("<div/>", {
		class: "row-label",
		html: settings.label
	}).appendTo(mainRow)

	row.content = $("<div/>", {
		class: "row-content",
	}).appendTo(mainRow)

	row.controls = $("<div/>", {
		class: "row-controls",
	}).appendTo(mainRow)
	return row;
}

function createSection(settings, createHeaderSections) {
	let div = $("<div>", {
		class: "section " + (settings.classes ? settings.classes : ""),
		id: settings.id
	}).appendTo(settings.holder)

	div.header = $("<div>", {
		class: "section-header",
		html: settings.title
	}).appendTo(div)

	if (createHeaderSections) {
		div.header.html("")
		div.title = $("<div>", {
			class: "section-title",
			html: settings.title
		}).appendTo(div.header)

		div.subtitle = $("<div>", {
			class: "section-subtitle",
		}).appendTo(div.header)

		div.controls = $("<div>", {
			class: "section-controls",
		}).appendTo(div.header)
	}

	div.content = $("<div>", {
		class: "section-content",

	}).appendTo(div)
	return div;
}

function createCard(settings) {
	let div = $("<div>", {
		class: "card " + (settings.classes ? settings.classes : ""),
		id: settings.id
	}).appendTo(settings.holder)

	div.header = $("<div>", {
		class: "card-header",

	}).appendTo(div)

	div.title = $("<div>", {
		class: "card-title",
		html: settings.title

	}).appendTo(div.header)

	if (settings.subtitle)
		div.subtitle = $("<div>", {
			class: "card-subtitle",
			html: settings.subtitle

		}).appendTo(div.header)

	div.controls = $("<div>", {
		class: "card-controls",

	}).appendTo(div.header)

	div.content = $("<div>", {
		class: "card-content",

	}).appendTo(div)
	return div;

}


function addEventHandler(event, fxn) {
	if (this.eventHandlers === undefined) {
		this.eventHandlers = {};
	}
	if (this.eventHandlers[event] === undefined) {
		this.eventHandlers[event] = [];
	}

	this.eventHandlers[event].push(fxn)
}

function doEventHandlers(event, ...params) {

	if (this.eventHandlers && this.eventHandlers[event]) {
		let fxns = this.eventHandlers[event];
		for (var i = 0; i < fxns.length; i++) {
			fxns[i].apply(this, params);
		}
	}

}