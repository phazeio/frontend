var Constants = {SPEED: 5
	, FOOD_RADIUS: 6
	, LINE_WIDTH: 5
	, PLAYER_RADIUS: 25
	, SNAKINESS: 10
	, TURN_SOFTEN: 10
	, SHARD_SPEED: 8
	, VIEW_DISTANCE: 1000
	, MAP_SIZE: 10000};

/*
* @param o - an Entity object
*
* @return object - x and y canvas coordinates
*/
function crds2ctx(o) {
	var x = Game.Player.x - o.x
		, y = Game.Player.y - o.y;

	return {x: Game.View.width / 2 - x, y: Game.View.height / 2 - y};
}

/*
* @param start - an Entity object or mouse object
* @param end - an Entity object or mouse object
*
* @return object - the angle (in radians) on [0, 2pi] from the start object to the end object
*/	
function angleBetween(start, end) {
	var y = end.y - start.y,
			x = end.x - start.x;
	return ((Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2))
}

function sineCircleXYatAngle(cx, cy, radius, amplitude, angle, sineCount){
	var x = cx + (radius + amplitude * Math.sin(sineCount * angle)) * Math.cos(angle),
		y = cy + (radius + amplitude * Math.sin(sineCount * angle)) * Math.sin(angle);
  	return({x:x,y:y});
}

function toDegrees(n) {
	return n * 180 / Math.PI;
}


/*
* @param value - a numeric value
* @param decimals - the desired number of trailing digits
*
* @return object - the number rounded to the specified number of trailing digits
*/	
function round(value, decimals) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
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
	var c = '#' + Math.floor(Math.random() * 16777215).toString(16);
	
	if(h2r(c) == null)
		return randomColor();

	if(h2r(c).r !== null)
		return c;

	return randomColor();
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
* find food
*/
function findFood(_id) {
	var food = null;
	Game.food.forEach(e => {
		if(e._id === _id)
			return food = e;
	})

	return food;
}

/*
* find player
*/
function findPlayer(_id) {
	var player = null;
	Game.players.forEach(e => {
		if(e._id === _id)
			return player = e;
	})

	return player;
}

/*
* find shard
*/
function findShard(_id) {
	var s = null;
	Game.shards.forEach(e => {
		if(e._id === _id)
			return s = e;
	})

	return s;
}

/*
* draw players
*/
function drawAllPlayers() {
	Game.players.forEach(p => {
		drawPlayer(p);
	});
}

/*
* @param p - Player object
*/
function drawPlayer(p) {
	var crds = crds2ctx(p)
		, x = crds.x
		, y = crds.y;

	var amp = 1.2,
		sineCount = Math.floor(Math.random() * 5) + 3,
		start = 0,
		stop = start + 360;

	ctx.beginPath();

	for (var i = 0; i < 360; i++)
		p.skews[i] /= 1.1;

	for (var i = 0; i < 360; i++) 
		if (p.impact[i])
			var radiusOfImpact = 2 * Constants.FOOD_RADIUS / p.radius;
			for (var j = 0; j < radiusOfImpact * 2; j++) 
				p.skews[((~~(i - radiusOfImpact + j)) + 360) % 360] += p.impact[i] * Math.sin(j * Math.PI / radiusOfImpact / 2);

	p.impact = [];

	for (var i = 0; i < 360; i++) {
		var angle = i * Math.PI / 180,
	  		pt = sineCircleXYatAngle(x, y, p.radius - p.skews[i], amp, angle, sineCount);
	  	ctx.lineTo(pt.x, pt.y);
	}


	ctx.shadowBlur = 20;
	ctx.shadowColor = '#595959';
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.fillStyle = (p.damage ? '#ff3333' : p.color);
	ctx.fill();
	ctx.lineWidth = Constants.LINE_WIDTH;
	ctx.strokeStyle = (p.damage ? '#cc0000' : 'rgb(' + h2r(p.color).r + ', ' + h2r(p.color).g + ', ' + ((h2r(p.color).b + 15) > 255 ? 255 : (h2r(p.color).b + 15)) + ')');
	ctx.closePath();
	ctx.stroke();

	ctx.font = "20px Helvetica";
	ctx.shadowColor = p.color;
	ctx.shadowBlur = 10;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.fillStyle = p.color;
	ctx.textAlign = "center";
	ctx.fillText(p.username, x, y + p.radius + 20); 
}

/*
* Draws all food entities on the map
*/
function drawAllFood() {
	for (var i = 0; i < Game.food.length; i++) {
		Game.food[i].fadeIn(0.3);
		Game.food[i].checkForce(Game.Player);
		Game.food[i].draw();
		if (Game.food[i].isEaten()) {
			SpermEvent.emit('player_eat_event', {player: Game.Player, food: Game.food[i]});
			Game.food.splice(i, 1);
			i--;
		}
	}
}

function drawAllShards() {
	Game.shards.forEach(s => s.draw());
}

try {
	module.exports.Constants = Constants;
	module.exports.angleBetween = angleBetween;
	module.exports.sineCircleXYatAngle = sineCircleXYatAngle;
	module.exports.getDistance = getDistance;
	module.exports.areOverlapping = areOverlapping;
	module.exports.randomColor = randomColor;
	module.exports.h2r = h2r;
} catch(e) {
	console.log('Running in browser');
}