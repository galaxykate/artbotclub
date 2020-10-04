function Blackboard() {
	this.root = {
		key: "--root--",
		type: "dict",
		props: {}
	}


}

Blackboard.prototype.toCondensed = function() {
	
	function toCondensed(root) {
		switch(root.type) {
			case "dict":
				return mapObject(root.props, prop => toCondensed(prop))
			case "array":
				return root.items.map(prop => toCondensed(prop))
			default:
				return root.value
		}
	}
	return toCondensed(this.root)
}
Blackboard.prototype.getNodeAtPath = function(path, allowNodeCreation) {
	let root = this.root
	for (var i = 0; i < path.length; i++) {
		let key = path[i]
		
		// Is this currently an empty node? 
		// If we have a key, then it should be a container
		let containerType = typeof key === 'string'?"dict":"array"
		let containerKey = containerType==='dict'?"props":"items"
		let emptyContainer = containerType==='dict'?{}:[]
		
		if (typeof key !== "string" && typeof key !== "number")
			throw(`Unknown key type ${typeof key} in path [${path}]`)

		// Create a container node if there isnt one
		if (root.type === undefined) {
			console.log(`Set container type:${containerType} for node ${root.key}`)
			Vue.set(root, "type", containerType)
			Vue.set(root, containerKey, emptyContainer)
			console.log(root.type)
		}


		if (containerType !== root.type)
			throw(`Can't use key '${key}' in ${root.type} container`)
		
		if (root[containerKey][key] === undefined) {
			if (allowNodeCreation) {
				Vue.set(root[containerKey], key, {
					displayType: undefined,
					key: key
				})
			}
			else 
				throw(`Path [${path}] does not exist, missing key '${key}'`)
		}
		root = root[containerKey][key]
	}
	return root
}

Blackboard.prototype.getAtPath = function(path) {
	let node = this.getNodeAtPath(path, false)
	// console.log(node)
	return node.value
}
Blackboard.prototype.setAtPath = function(path, value) {
	// console.log(`Set at path [${path}]`, value)

	let node = this.getNodeAtPath(path, true)
	Vue.set(node, "value", value)
	// console.log(this.root)
}