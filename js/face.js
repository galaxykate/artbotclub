function getValue(id) {
	let index = Math.abs(id.hashCode())%5
	// console.log(index)
	try {
		let val = app.chanceryInstance.blackboard.getAtPath([id])
		// console.log(id,val)
		return val
	} catch(err) {
		// console.log(err)
		let val = app.chanceryInstance.blackboard.getAtPath(["midi", index])
		return val
	}
}

function Particle({word,lifespan}) {
	this.word = word
	this.p = Vector.polar(Math.random()*100, Math.random()*100)
	this.v = Vector.polar(Math.random()*100 + 30, Math.random()*100)
	this.radius = 1
	this.age = 0
	this.lifespan = lifespan
	this.drag = .9

}

Particle.prototype.draw = function(g) {
	g.fill(1, 0, 1, 1 - this.age)

	if (this.word) {
		g.textSize(20*this.radius)
		g.text(this.word, this.p.x, this.p.y, this.word)
	}
}


Particle.prototype.update = function(t) {
	this.p.addMultiple(this.v, t.elapsed)
	this.v.mult(Math.pow(this.drag,t.elapsed*10))

	if (this.start === undefined) {
		this.start = t.current
	}
	// console.log(this.start, t.current, this.lifespan)
	this.age = (t.current - this.start)/this.lifespan
	// console.log(this.age)
}



function Face() {
	this.width  = 300
	this.height = 400
	this.rows = 16
	this.columns = 13
	this.pixelW = this.width/this.columns
	this.pixelH = this.height/this.rows


	this.detailColor = new KColor(.5, .6, .6)
	this.faceColor = new KColor(.9, .9, .8)

	this.particles = []
}

// Say s, and return a promise
Face.prototype.say = function(s) {
	let count = 0
	let loop = setInterval( () => {
		let sound = getRandom(app.sounds)
		sound.play()
		count++
		if (count > 5)
			clearInterval(loop)
	}, 200)


	
	// Add this to the queue
	return new Promise((resolve, reject) => {

	})
}

Face.prototype.update = function(t) {
	this.particles.forEach(p => p.update(t))

	this.particles = this.particles.filter(p => p.age === undefined || p.age < 1)
}

Face.prototype.setWord = function(word, length) {
	
	let dt = length*.001
	app.valueTracker.mouth.set(Math.random()*.3 + .3, this.lastTime, dt*.3)

	setTimeout(() => {
		app.valueTracker.mouth.set(Math.random(),this.lastTime,dt*.2)
	},  dt*.4*1000)

	setTimeout(() => {
		app.valueTracker.mouth.set(Math.random(),this.lastTime,dt*.2)
	},  dt*.6*1000)

	setTimeout(() => {
		app.valueTracker.mouth.set(0,this.lastTime,dt*.1)
	},  dt*.8*1000)

	this.particles.push(new Particle({word:word, lifespan:length*.007}))
}

Face.prototype.drawSpace = function(g, t) {
	let stress = getValue("agitation")*10
	let p = new Vector()
	let count = 100
	for (var i = 0; i < count; i++) {
		let pct = i/count
		p.setToPolar(200*(1.2 + Math.sin(4*pct*(2 + stress*.2 + .7*Math.sin(t*.2)) + t*.1)), 20*Math.sin(20*(2 + 1*Math.sin(t*.001))*pct))
		
		let r = 1 + Math.sin(pct*100 + t*.4)
		
		g.noStroke()
		g.fill((i*.01 + t*3)%1, .9, .6, .2)
		p.drawCircle(g, 3*r)
		g.fill(1, 0, 1)
		p.drawCircle(g, 1*r + .1)
	}
}

Face.prototype.drawFaceDetails = function(g, t) {
	let pw = this.pixelW
	let ph = this.pixelH


	let fuzz = getValue("eyeFuzz")*10
	let mouth = getValue("mouth")*2
	let mouthWidth = getValue("mouthWidth")
	let blink = getValue("blink")*10
	// let detailShade = app.values.detailShade
	let detailShade  = 1 - getValue("opacity")

	let offset = new Vector()
	for (var i = 0; i < 4; i++) {

		// 

		let hueShift = .1*fuzz*Math.sin(i + t)
		this.detailColor.hueShift(hueShift).fill(g, Math.sin(i) + detailShade - .5, .6)
		offset.setToPolar(fuzz*i*utilities.noise(t), 20*utilities.noise(t*.02, i))
		g.pushMatrix()
		g.translate(offset.x, offset.y)

		let sides = [-1,1]

		// Draw the eyes
		sides.forEach(scaleX => {
			g.pushMatrix()
			g.scale(scaleX,1)
			g.translate(pw*1.5, ph*-3)
			// eyebrows
			g.scale(1, 1 - blink*.2)
			g.rect(0, -ph, pw*4, ph*1)

			g.scale(1, 1 - .9*blink)
			g.rect(0, 0, pw*2, ph*1)

			g.popMatrix()

		})

		// Nose
		g.rect(-pw*1.5, ph*-4, pw*1, ph*7)
		g.rect(-pw*.5, ph*2, pw*2, ph*1)
		
		// Mouth
		g.pushMatrix()
		g.translate(0, pw*5)
		g.scale((1 + mouth*.4)*(1 - mouthWidth*.5), 1 - mouth*.2)
		g.rect(-pw*3.5, -ph, pw*7, ph*1)
		
		g.scale(1, mouth*2.8 + .2)
		g.rect(-pw*1.5, 0, pw*3, ph*1)

		g.popMatrix()		

		g.popMatrix()
	}
}

Face.prototype.drawFaceBG = function(g, t) {
	let rainbow = getValue("rainbow")
	let faceOpacity = getValue("opacity")
	let hue = getValue("hue")
	let stress = getValue("agitation")*10

	let w = this.width
	let h = this.height
	let pw = this.pixelW
	let ph = this.pixelH

	

	// Draw the static rectangle
	this.faceColor.h = hue
	this.faceColor.fill(g, rainbow, .4*faceOpacity)
	g.rect(-w/2, -h/2, w, h)

	this.faceColor.s = 1 - rainbow/11
	
	// Draw the face squares	
	for (var i = 0; i < this.columns; i++) {
		for (var j = 0; j < this.rows; j++) {
			let jiggle = stress*9
			g.noFill()
			g.noStroke()
			let rainbowJiggle = .08*rainbow*utilities.noise(i + 4*t*jiggle , 100 + j + 4*t*jiggle, t )

			this.faceColor.hueShift(rainbowJiggle).fill(g, .2 + (.2*stress + .3)*utilities.noise(i, j, t), faceOpacity)

			let r = Math.pow(stress, 3)*5*pw
			// console.log(r)
			let theta =i + j + .3*utilities.noise(i + t*jiggle , j + t*jiggle )
			let x = -w/2 + i*pw 
			let y = -h/2 + j*ph 

			g.rect(x + r*Math.sin(theta), y + r*Math.cos(theta), pw + 1, ph + 1)
		}
	}

}

Face.prototype.draw = function(g, time) {

	g.fill(0, 0, 0,.2)
	g.rect(-g.width/2, -g.height/2, g.width, g.height)
	let t = time.current
	this.lastTime = t


	
	let zoomScale = 1/(getValue("perspective")*7 + .7)
	
	// Draw spacey particles
	if (getValue("perspective") > -1) {
		let z2 = utilities.lerp(zoomScale, 1, .8)
		g.pushMatrix()
		g.scale(z2, z2)
		this.drawSpace(g, t)
		g.popMatrix()
	}

	g.pushMatrix()
	g.translate(0, -g.height*.09)
	g.scale(zoomScale, zoomScale)


	this.drawFaceBG(g, t)
	this.drawFaceDetails(g, t)

	g.popMatrix()


	// Draw speech particles
	this.particles.forEach(p => p.draw(g))


	// app.valueTracker.mouthWidth.draw(g, t)
}