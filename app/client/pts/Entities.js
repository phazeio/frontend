
/**
* Entity Class
*/
function Entity(x, y, radius, _id, color) {
	this.x 		= x;
	this.y 		= y;
	this.color 	= color;
	this.radius = radius;
	this._id  	= _id || null;

	// set id
	this.set_id = (_id) => this._id = _id;

	this.setX = x => this.x = x;
	this.setY = y => this.y = y;
	this.setColor = c => this.color = c;
	this.setRadius = r => this.radius = r;

	this.getX = () => this.x;
	this.getY = () => this.y;
	this.getColor = () => this.color;
	this.getRadius = () => this.radius;
}

/**
* Player Class
*/
function Player(username, x, y, _id, color) {
	Entity.call(this, x, y, Constants.PLAYER_RADIUS, _id, color);
	this.food = [];
	this.skews = [];
	this.impact = [];
	this.score = 0;
	this.nitrous = false;
	this.username = username;
	// this.speed = SPEED;

	this.getScoreDecrease = () => 0.005 * this.score;

	for (var i = 0; i < 360; i++)
		this.skews[i] = 0;


	/*
	* move player
	*/
	this.move = () => {

		console.log(this.x, this.y);
		if(this.y - this.radius > 0 && this.y + this.radius < Constants.MAP_SIZE)
			this.y += this.speed * Math.sin(theta);

		if(this.x - this.radius > 0 && this.x + this.radius < Constants.MAP_SIZE)
			this.x += this.speed * Math.cos(theta);
	}

	/* 
	* update angle
	*/
	this.update = () => {

		var newTheta = angleBetween(crds2ctx({
			x: this.x,
			y: this.y})
			, mouse);

		var dif = Math.abs(newTheta - theta);

		if (dif > Math.PI) {
			dif = (2 * Math.PI) - dif;
			theta += ((Math.abs(theta - newTheta) > Math.PI && newTheta < Math.PI) ? dif / Constants.TURN_SOFTEN : -1 * dif / Constants.TURN_SOFTEN) + Math.PI * 2;
			theta %= Math.PI * 2;
		} else {
			theta += newTheta > theta ? dif / Constants.TURN_SOFTEN : -1 * dif / Constants.TURN_SOFTEN;
		}

		this.radius = Constants.PLAYER_RADIUS + (0.5 * this.score);

		SpermEvent.emit('angle_update', {player: this, angle: theta});
	}

	/*
	* draw player
	*/
	this.draw = (x, y) => {

		var amp = 1.2,
			sineCount = ~~(Math.random() * 5) + 3,
			start = 0,
			stop = start + 360;

		ctx.beginPath();

		for (var i = 0; i < 360; i++)
			this.skews[i] = round(this.skews[i] / 1.1, 1);


		for (var i = 0; i < 360; i++) 
			if (this.impact[i]) {
				var radiusOfImpact = ~~(340 * Constants.FOOD_RADIUS / this.radius / Math.PI);
				for (var j = 0; j < radiusOfImpact * 2; j++) 
					this.skews[((~~(i - radiusOfImpact + j)) + 360) % 360] += round(this.impact[i] / 5 * Math.sin(j * Math.PI / radiusOfImpact / 2), 1);
			}

		console.log(this.skews);

		this.impact = [];

		for (var i = 0; i < 360; i++) {
			var angle = i * Math.PI / 180,
		  		pt = sineCircleXYatAngle(x, y, this.radius - this.skews[i], amp, angle, sineCount);
		  	ctx.lineTo(pt.x, pt.y);
		}


		ctx.shadowBlur = this.nitrous ? 30 : 20;
		ctx.shadowColor = this.nitrous ? '#ff5050' : '#595959';
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.lineWidth = Constants.LINE_WIDTH;
		ctx.strokeStyle = 'rgb(' + h2r(this.color).r + ', ' + h2r(this.color).g + ', ' + ((h2r(this.color).b + 15) > 255 ? 255 : (h2r(this.color).b + 15)) + ')';
		ctx.closePath();
		ctx.stroke();

		ctx.font = 20 + "px Helvetica";
		ctx.shadowColor = this.color;
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = this.color;
		ctx.textAlign = "center";
		ctx.fillText(this.username, window.outerWidth / 2, window.outerHeight / 2 + this.radius + 20); 
	}

	this.hasFood = function(_id) {
		this.food.forEach(e => {
			if(e._id === _id)
				return true;
		})

		return false;
	}
}

/**
* Food Class
*
*/
function Food(x, y, color, _id) {
	Entity.call(this, x, y, Constants.FOOD_RADIUS, _id, color);

	this.color = randomColor();
	this.radius = Constants.FOOD_RADIUS * 0.2;
	this.chained = false;

	this.draw = function() {
		var r = h2r(this.color)
			, crds = crds2ctx(this);

		if (this.chained && Game.Player.nitrous === true) {
			ctx.shadowColor = '#ff5050'
			ctx.shadowBlur = 30;
			ctx.shadowBlur = 10;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
		}

		if (null != r && null !== r)
			ctx.fillStyle = 'rgba(' + r.r + ', ' + (r.g + 30 > 255 ? 255 : r.g + 30) + ', ' + (r.b + 30 > 255 ? 255 : r.b + 30) + ', ' + 0.4 + ')';
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
		var dist = getDistance(o, this)
			, distThreshold = 20
			, padding = 2
			, attractionStrength = distThreshold - dist + padding;

		if (dist < distThreshold) {
			var angle = angleBetween(this, o);
			o.impact[~~toDegrees(angle + Math.PI) % 360] = attractionStrength * 1.5;
			this.y += attractionStrength * Math.sin(angle);
			this.x += attractionStrength * Math.cos(angle);
			this.radius = (this.radius - 0.25 * attractionStrength) < 0 ? 0.1 : (this.radius - 0.25 * attractionStrength);
			SpermEvent.emit('food_move', {food: this});
		}

	}

	/* 
	*follow leader when chained
	*/
	this.followLeader = function(o) {
		var dist = getDistance(o, this)
			, distThreshold = 20
			, attractionStrength = distThreshold - dist - Constants.SNAKINESS
			, angle = angleBetween(this, o);

		this.y -= attractionStrength * Math.sin(angle);
		this.x -= attractionStrength * Math.cos(angle);
	}

	/*
	*slowly increase food radius
	*/
	this.fadeIn = function (rate) {
		if (this.chained)
			this.radius = this.radius < Constants.FOOD_RADIUS + (Game.Player.score * 0.2) ? this.radius + rate : Constants.FOOD_RADIUS + (Game.Player.score * 0.2);
		else
			this.radius = this.radius < Constants.FOOD_RADIUS ? this.radius + rate : Constants.FOOD_RADIUS;
	}

}