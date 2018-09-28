function expressionToDiv(holder, c, hasFill) {
	let useLabel = !((c.type === "key") || (c.type === "traceryRule")  || (c.type === "targetmacro") || (c.type === "number"))
	let div = holder;
	if (useLabel) {
		div = $("<div/>", {
			class: "chancery-inline",
		}).appendTo(holder)

		let toplabel = $("<div/>", {
			class: "topline",
			html: c.raw,
		}).appendTo(div)
	}


	let label, pill

	if (hasFill) {
		pill = new FillPill(div, "chancery-exp chancery-exp-" + c.type, "", hasFill)
		label = pill.label;
	} else {
		label = $("<div/>", {
			class: "chancery-exp chancery-exp-" + c.type,
		}).appendTo(div)
	}

	switch (c.type) {
		case "wait":
			label.html("🕑" + c.value.raw);
			break;
		case "targetmacro":
			label.html(c.value);
			break;
		case "say":
			expressionToDiv(label, c.value, false);
			break;
		case "expression":

			c.sections.map((item) => {
				if (item.type === "op")
					$("<div/>", {
						class: "chancery-op",
						html: item.value,
					}).appendTo(label)
				else
					expressionToDiv(label, item, false);
			})

			break;
		case "number":
		case "key":
			label.html(c.value);
			break;

		case "traceryRule":
			label.html(c.value);
			break;

		case "path":
			c.sections.map((item, index) => {
				if (index > 0)
				label.append(",")
				expressionToDiv(label, item, false)

			})

			break;
		case "function":
		console.log(c)
			expressionToDiv(label, c.fxnPath, false)
			 label.append("(");
			c.parameters.map(p => {

				expressionToDiv(label, p, false)
			})
			 label.append(")")
			break;
		default:
			console.warn(c.type, c)
			label.html("!!" + c.raw + "!!")
	}


	return pill;
}

function exitToDiv(holder, exit, isWatcher) {


	let row = createRow({
		topline: exit.raw,
		holder: holder,
		classes: "chancery-exit" + (isWatcher ? " chancery-exitwatcher" : "")

	})


	if (exit.conditions.length > 0)
		row.conditions = $("<div/>", {
			class: "chancery-exitconditions"
		}).appendTo(row.content);

	row.target = new FillPill(row.content, "chancery-exittarget",
		"➜", isWatcher)

	expressionToDiv(row.target.label, exit.target)

	if (exit.actions.length > 0)
		row.actions = $("<div/>", {
			class: "chancery-exitactions"
		}).appendTo(row.content);

	function actionListToDiv(holder, list, isWatcher, type) {
		list.map(item => {
			let itemDiv = $("<div/>", {
				class: "chancery-" + type,
			}).appendTo(holder)

			return expressionToDiv(itemDiv, item, isWatcher)
		})

	}

	let exitWatcher = {
		holder: row,
		conditions: actionListToDiv(row.conditions, exit.conditions, isWatcher, "condition"),
		actions: actionListToDiv(row.actions, exit.actions, isWatcher, "action"),
		target: row.target
	}



	return exitWatcher
}

function ChanceryView(holder, map) {
	// Show the chancery maps(states & exits) as non-updating visualization

	let card = createCard({
		holder: holder,
		title: map.title,
		subtitle: map.id,
		classes: "chanceryview"

	});


	let stateHolder = $("<div/>").appendTo(card.content);
	let bbHolder = $("<div/>").appendTo(card.content);



	let states = mapObject(map.states, (state, id) => {


		let section = createSection({
			holder: stateHolder,
			title: id
		});

		let exitHolder = $("<div/>").appendTo(card.content);

		let exits = state.exits.map(exit => {
			exitToDiv(section.content, exit)
		})
	})


}