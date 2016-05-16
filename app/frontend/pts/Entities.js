
/**
* Entity Class
*/
function Entity(x, y, radius) {
	this.x 		= x;
	this.y 		= y;
	this.color 	= randomColor();
	this.radius = radius;

	// this.getRadius = () => this.radius + Game.Zoom.getZoom();
}

// https://cdn.thinglink.me/api/image/727110550026190849/1240/10/scaletowidth
var doge = document.createElement('img');
doge.src = 'https://cdn.thinglink.me/api/image/727110550026190849/1240/10/scaletowidth';

/**
* Player Class
*/
function Player(username) {
	Entity.call(this, ~~((Math.random() * 300) + MAP_SIZE / 3), ~~((Math.random() * 300) + MAP_SIZE / 3), PLAYER_RADIUS);
	this.food = [];
	this.score = 0;
	this.nitrus = false;
	this.username = username;
	this.speed = SPEED;

	this.getScoreDecrease = () => 0.02 * this.score;

	/*
	* move player
	*/
	this.move = () => {
		// if(this.y + SPEED * Math.sin(theta) > 0 && this.y + SPEED * Math.sin(theta) < Game.Map.height)
			this.y += this.speed * Math.sin(theta);
		// if(this.x + SPEED * Math.sin(theta) > 0 && this.x + SPEED * Math.sin(theta) < Game.Map.width)
			this.x += this.speed * Math.cos(theta);

			// EMIT MOVE EVENT
			SpermEvent.emit('player_move_event', this);
	}

	/* 
	* update angle
	*/
	this.update = () => {
		var n = angleBetween({x: window.innerWidth / 2, y: window.innerHeight / 2}, mouse);

		theta = n;
		// Smoother Movement
		// if(n < theta) 
		// 	theta = theta - (theta - n) / 10;
		// else
		// 	theta = theta + (n - theta) / 10;

		this.radius = PLAYER_RADIUS + (0.5 * this.score);
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

		doge.width = this.radius + 5;
		doge.height = this.radius + 5;

		// ctx.fillStyle = ctx.createPattern(doge, 'repeat');

		if(this.nitrus === true) {
			ctx.shadowColor = '#ff5050'
			ctx.shadowBlur = 30;
		} else {
			ctx.shadowColor = '#595959';
			ctx.shadowBlur = 20;
		}

		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.lineWidth = LINE_WIDTH;
		ctx.strokeStyle = 'rgb(r: ' + h2r(this.color).r + ', g: ' + (h2r(this.color).g) + ', b: ' + (h2r(this.color).b + 15) + ')';
		ctx.closePath();
		ctx.stroke();

		// because double tildas are fucking cool
		ctx.font = (~~20) + "px Helvetica";

		ctx.shadowColor = this.color;
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.fillText(this.username, window.outerWidth/2, window.outerHeight/2 + this.radius + 20); 

		// reset shadow color
		ctx.shadowColor = 'rgba(0,0,0,0)';
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

		if(this.chained)
			if(Game.Player.nitrus === true) {
				ctx.shadowColor = '#ff5050'
				ctx.shadowBlur = 30;
				ctx.shadowBlur = 10;
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;
			}

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
		var padding = 2;
		var attractionStrength = distThreshold - dist + padding;

		if (dist < distThreshold) {
			var angle = angleBetween(this, o);
			this.y += attractionStrength * Math.sin(angle);
			this.x += attractionStrength * Math.cos(angle);
			this.radius = (this.radius - 0.25 * attractionStrength) < 0 ? 0.1 : (this.radius - 0.25 * attractionStrength);
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
		if(this.chained)
			this.radius = this.radius < FOOD_RADIUS + (Game.Player.score * 0.2) ? this.radius + rate : FOOD_RADIUS + (Game.Player.score * 0.2);
		else
			this.radius = this.radius < FOOD_RADIUS ? this.radius + rate : FOOD_RADIUS;
	}

}