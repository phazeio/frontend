
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

	this.impactPoints = [];

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





	this.isEaten = function() {
		return areOverlapping(this, Game.Player, 2);
	}

	/*
	* check the distance between food and player
	* if size / force of player object is strong enough, start moving food towards the object
	* make the food smaller as it moves towards the player 
	* do the fancy stuff w/ the sinusoid at the right position to make the collision look pretty
	*/
	this.checkForce = function(o) {
		var dist = getDistance(o, this);
		var distThreshold = 20;
		var padding = 5;
		var attractionStrength = distThreshold - dist + padding;

		if (dist < distThreshold) {
			var angle = angleBetween(this, o);
			this.y += attractionStrength * Math.sin(angle);
			this.x += attractionStrength * Math.cos(angle);
			this.radius = (this.radius - 0.25 * attractionStrength) < 0 ? 0.1 : (this.radius - 0.25 * attractionStrength);
			Game.Player.impactPoints.push({
				angle: (Math.PI - angle) * 180 / Math.PI,
				distance: dist
			})
		}

	}

	/* 
	*follow leader when chained
	*/
	this.followLeader = function(o) {
		var dist = getDistance(o, this);
		var distThreshold = 20;
		var attractionStrength = distThreshold - dist - SNAKINESS;

		var angle = angleBetween(this, o);
			this.y -= attractionStrength * Math.sin(angle);
			this.x -= attractionStrength * Math.cos(angle);
	}

	/*
	*slowly increase food radius
	*/
	this.fadeIn = function (rate) {
		this.radius = this.radius < FOOD_RADIUS ? this.radius + rate : FOOD_RADIUS;
	}

}