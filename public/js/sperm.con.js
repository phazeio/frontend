/*
* @param o - an Entity object
*
* @return object - x and y canvas coordinates
*/
function crds2ctx(o) {
	var x = Game.Player.x - o.x
		, y = Game.Player.y - o.y;

	return {x: Game.View.canvas.width / 2 - x, y: Game.View.canvas.height / 2 - y};
}

/*
* @param start -
* @param end - 
*
* @return object - 
*/	
function angleBetween(start, end) {
	var opp = end.y - start.y,
			adj = end.x - start.x;
	return Math.atan(opp/adj) + (end.x <= start.x ? Math.PI : 0); //theta depends on quadrant
}

function sineCircleXYatAngle(cx, cy, radius, amplitude, angle, sineCount){
	var x = cx + (radius + amplitude * Math.sin(sineCount * angle)) * Math.cos(angle),
		y = cy + (radius + amplitude * Math.sin(sineCount * angle)) * Math.sin(angle);
  	return({x:x,y:y});
}

function spawnFood() {
	Game.food.push(new Food());
}

/*
* @param o1 - an Entity object
* @param o2 - an Entity object
*
* returns double - distance between two entities
*/
function getDistance(o1, o2) {
	return Math.sqrt(Math.pow((o1.x - o2.x), 2) + Math.pow((o1.y - o2.y), 2)) - (o2.radius + o1.radius);
}

/*
* @param o1 - an Entity object
* @param o2 - an Entity object
* @param skew - an int Skew the distance
*
* @returns boolean - if entities are overlapping
*/
function areOverlapping(o1, o2, skew) {
	return getDistance(o1, o2) < (0 - (skew || 0 ));
}

/*
* Generates random hex color
*/
function randomColor() {
	return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

/* 
* @param h - a hex value
* translates hex into rgb
*
* @return rgb value
*/
function h2r(h) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/*
* Draws all food entities on the map
*/
function drawAllFood() {
	for (var i = 0; i < Game.food.length; i++) {
		Game.food[i].radius = Game.food[i].radius < FOOD_RADIUS ? Game.food[i].radius + 0.3 : FOOD_RADIUS;
		if (!Game.food[i].chained) Game.food[i].checkForce(Game.Player);
		Game.food[i].draw();
	}

	if (Game.Player.food[0]) 
		Game.Player.food[0].checkForce(Game.Player);	
	for (var i = 1; i < Game.Player.food.length; i++) 
		if (Game.Player.food[i]) {
			Game.Player.food[i].checkForce(Game.Player.food[i - 1]);
		}
}

/**
* Entity Class
*/
function Entity(x, y, radius) {
	this.x 		= x;
	this.y 		= y;
	this.color 	= randomColor();
	this.radius = radius;
}

/**
* Player Class
*/
function Player() {
	Entity.call(this, ~~((Math.random() * 300) + MAP_SIZE / 3), ~~((Math.random() * 300) + MAP_SIZE / 3), PLAYER_RADIUS);
	this.food = [];

	/*
	* move player
	*/
	this.move = () => {
		this.y += SPEED * Math.sin(theta);
		this.x += SPEED * Math.cos(theta);
	}

	/* 
	* update angle
	*/
	this.update = () => {
		theta = angleBetween({x: Game.View.width / 2, y: Game.View.height / 2}, mouse);
	}

	this.draw = (x, y) => {
		var amp = 1.2,
			sineCount = Math.floor(Math.random() * 5) + 3,
			start = Math.floor(Math.random() * 100),
			stop = start + 360;

		ctx.beginPath();

		for (var i = start; i < stop; i++) {
			var angle = i * Math.PI / 180,
		  		pt = sineCircleXYatAngle(x, y, this.radius, amp, angle, sineCount);
		  	ctx.lineTo(pt.x, pt.y);
		}

		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.lineWidth = LINE_WIDTH;
		ctx.strokeStyle = 'rgb(r: ' + h2r(this.color).r + ', g: ' + (h2r(this.color).g) + ', b: ' + (h2r(this.color).b + 10) + ')';
		ctx.closePath();
		ctx.stroke();
	}
}

/**
* Food Class
*
*/
function Food() {
	Entity.call(this, Math.random() * Game.Map.width, Math.random() * Game.Map.height, FOOD_RADIUS);

	this.color = randomColor();
	this.radius = FOOD_RADIUS * 0.2;
	this.chained = false;

	this.draw = function() {
		var r = h2r(this.color);

		if(r == null)
			return;

		var crds = crds2ctx(this);

		ctx.fillStyle = 'rgba(' + r.r + ', ' + (r.g + 30) + ', ' + (r.b + 30) + ', ' + 0.4 + ')';
		ctx.beginPath();
		ctx.arc(crds.x, crds.y, this.radius + 4 + (Math.random() * 1), 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(crds.x, crds.y, this.radius + (Math.random() * 1), 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}

	/*
	* Check force of object on object
	*/
	this.checkForce = function(o) {
		var dist = getDistance(o, this);
		var distThreshold = 26;

		if (this.chained) {
			var angle = angleBetween(this, o);
			this.y -= (16 - dist) * Math.sin(angle);
			this.x -= (16 - dist) * Math.cos(angle);
			return;
		}



		if (dist < 20) {
			var angle = angleBetween(this, o);
			this.y -= (16 - dist) * Math.sin(angle);
			this.x -= (16 - dist) * Math.cos(angle);
			// this.radius = (this.radius - 0.5) < 0.1 ? 0.1 : (this.radius - 0.5);
		}

		if (dist < 15 && !this.chained) { //chain chained food
			Game.Player.food.push(this);
			this.chained = true;
			this.radius = FOOD_RADIUS * 0.2;
			this.color = Game.Player.color;
		}
	}
}

/**
* View Class
*/
function View() {
	this.canvas = document.createElement('canvas');

	// so anything can access the context
	window.ctx = this.canvas.getContext('2d');

	this.canvas.width = this.width = window.innerWidth;
	this.canvas.height = this.height = window.innerHeight;

	document.body.appendChild(this.canvas);

	this.resize = () => {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	// only follow if players goes past 5px from the center in a direction
	this.follow = () => {
		var image = document.getElementById('source');
		// this.ctx.drawImage(image, 0, 0, 0 + (Game.Player.x - this.canvas.width), 0 + Game.Player.y, this.canvas.width, this.canvas.height);
	}

	this.draw = () => {
		ctx.fillStyle = '#ff99cc';
		ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

		var image = document.getElementById('source');
		ctx.drawImage(image, Game.Player.x, Game.Player.y, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);

		drawAllFood();

		Game.Player.draw(this.width / 2, this.height / 2);
	}
}