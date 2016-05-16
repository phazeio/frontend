var Game = {}
	, SPEED = 5
	, FOOD_RADIUS = 6
	, PLAYER_RADIUS = 25
	, SNAKINESS = 10;

// array of entities
Game.Entities = [];
Game.Map = new Map(6000, 6000);

Game.addEntity = e => {
	if(e instanceof Entity)
		Game.Entities.push(e);
}

Game.removeEntity = e => {
	Game.splice(Game.Entities.indexOf(e), 1);
}

function Map(w, h) {
	this.width = w;
	this.height = h;
	this.bkg = 'url';
}

function Entity(x, y, radius) {
	this.x 		= x;
	this.y 		= y;
	this.color 	= randomColor();
	this.radius = radius;
}

function Player(username) {
	Entity.call(this, ~~((Math.random() * 300) + MAP_SIZE / 3), ~~((Math.random() * 300) + MAP_SIZE / 3), PLAYER_RADIUS);
	this.food = [];
	this.score = 0;
	this.username = username;
}

function Food() {
	Entity.call(this, ~~((Math.random() * MAP_SIZE)), ~~((Math.random()* MAP_SIZE)), FOOD_RADIUS);
	this.food = [];
	this.score = 0;
}