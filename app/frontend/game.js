var Game = {}
	, SPEED = 3
	, MAP_SIZE = 4000
	, FOOD_RADIUS = 8
	, LINE_WIDTH = 5
	, PLAYER_RADIUS = 30
	, CTX = null
	, theta = 0
	, mouse = {
		x: 0,
		y: 0
	}
	, PLAYER = new Player();

Game.Map = new Map(4000, 4000);
Game.View = new View();
Game.Player = new Player();
Game.food = [];

/**
* Map Class
*
*/
function Map(w, h) {
	this.width = w;
	this.height = h;
	this.bkg = document.getElementById('source');
}

document.body.onmousemove = function(e) {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
}


setInterval(() => {
	Game.Player.update();
	Game.Player.move();

	Game.View.follow();
	Game.View.draw();
}, 1000 / 60)

setInterval(() => {
	Game.food.push(new Food());
	console.log('pushed!')
}, 1000)

setInterval(() => {
	console.log(Game.Player);
}, 3000);