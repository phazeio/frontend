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
* @param start -
* @param end - 
*
* @return object - 
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
		Game.food[i].fadeIn(0.3);
		Game.food[i].checkForce(Game.Player);
		Game.food[i].draw();
		if (Game.food[i].isEaten()) {
			Game.food[i].color = Game.Player.color;
			Game.food[i].radius = FOOD_RADIUS * 0.2;
			Game.food[i].chained = true;

			if(Game.Player.score === 0 || Game.Player.score % 5 === 0)
				Game.Player.food.push(Game.food[i]);

			SpermEvent.emit('player_eat_event', {player: Game.Player, food: Game.Food});
			Game.Zoom.scale();
			Game.Player.score++;
			Game.food.splice(i, 1);
			i--;
		}
	}

	if (Game.Player.food[0]) {
		Game.Player.food[0].followLeader(Game.Player);
		Game.Player.food[0].fadeIn(0.1);
		Game.Player.food[0].draw();
		for (var j = 1; j < Game.Player.food.length; j++) {
			Game.Player.food[j].followLeader(Game.Player.food[j - 1]);
			Game.Player.food[j].fadeIn(0.1);
			Game.Player.food[j].draw();	
		}
	}
}

try {
	module.exports.angleBetween = angleBetween;
	module.exports.sineCircleXYatAngle = sineCircleXYatAngle;
	module.exports.getDistance = getDistance;
	module.exports.areOverlapping = areOverlapping;
	module.exports.randomColor = randomColor;
	module.exports.h2r = h2r;
} catch(e) {
	console.log('Running in browser');
}