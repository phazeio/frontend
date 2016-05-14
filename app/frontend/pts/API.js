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