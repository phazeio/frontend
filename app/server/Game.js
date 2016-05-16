var API = require('../API')
	, key = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split()
	, createObjectID = (num) => {
		var str = '';
		for(var j = 0; j < num; j++)
			str += key[Math.random() * (key.length - 1)];
	}

var Game = {}
	, SPEED = 5
	, FOOD_RADIUS = 6
	, PLAYER_RADIUS = 25
	, SNAKINESS = 10
	, VIEW_DISTANCE = 2000;

// array of entities
Game.Food = [];
Game.Players = [];
Game.Map = new Map(15000, 15000);
Game.Leaderboard = [];

Game.FindFood = (_id) => {
	Game.Food.forEach(e => {
		if(e.get_id() == _id)
			return e;
	})
}

Game.RemoveFood = (e) => {
	Game.Food.splice(this.indexOf(e), 1);
}

Game.FindPlayer = (_id) => {
	Game.Players.forEach(e => {
		if(e.get_id() == _id)
			return e;
	})
}

Game.RemovePlayer = (e) => {
	Game.Players.splice(this.indexOf(e), 1);
}

// function EntityArray() {
// 	Array.call(this);

// 	this.find = (_id) => {
// 		this.forEach(e => {
// 			if(e.get_id() == _id)
// 				return e;
// 		})
// 	}

// 	this.removeEntity = e => {
// 		this.splice(this.indexOf(e), 1);
// 	}
// }

Game.start = function() {
	setInterval(() => {
		if(Game.Players != 0)
			Game.Food.push(new Food(API.randomColor()));
	}, 1000/5);
}

Game.addEntity = e => {
	if(e instanceof Entity)
		Game.Entities.push(e);
}
/*
* @class Map
*/
function Map(w, h) {
	this.width 		= w;
	this.height	 	= h;
	this.bkg 		= 'url';
}

/*
* @class Point
*/
function Point(x, y) {
	this.x = x;
	this.y = y;
}

/*
* @class Entity
*/
function Entity(x, y, radius, color) {
	Point.call(this, x, y);
	this._id 	= createObjectID();	
	this.radius = radius;
	this.color 	= color;

	// set id
	this.set_id = (_id) => this._id = _id;

	this.setX = x => this.x = x;
	this.setY = y => this.y = y;
	this.setColor = c => this.color = c;
	this.setRadius = r => this.radius = r;

	this.get_id = (_id) => this._id;
	this.getX = () => this.x;
	this.getY = () => this.y;
	this.getColor = () => this.color;
	this.getRadius = () => this.radius;
}

/*
* @class Player
*/
function Player(username, x, y, color) {
	Entity.call(this, x, y, PLAYER_RADIUS, color);
	this.food = [];
	this.score = 0;
	this.username = username;
	this.socket = null;

	this.getScore = () => this.score;
	this.getUsername = () => this.username;
	this.getFood = () => this.food;
	this.getSocket = () => this.socket;
}

Player.prototype.getView = () => {
	return new View(this.y - VIEW_DISTANCE, 
		this.y + VIEW_DISTANCE, 
		this.x - VIEW_DISTANCE, 
		this.y - VIEW_DISTANCE);
}

Player.prototype.addFood = f => {
	f.setChained(true);
	this.food.push(p)
};

/*
* @class View
*/
function View(tY, bY, rX, lX) {
	this.topY = tY;
	this.bottomY = bY;
	this.rightX = rX;
	this.leftX = lX;
}

/*
* @param r - object that implments Point class
* returns boolean
*/
View.prototype.isInView = r => {
	if(r.x > this.leftX && r.x < this.rightX && r.y > this.topY && r.y < this.bottomY)
		return true;

	return false;
}

/*
* @class Food
*/
function Food(color) {
	Entity.call(this, ~~((Math.random() * MAP_SIZE)), ~~((Math.random()* MAP_SIZE)), FOOD_RADIUS, color);
	this.chained = false;
	this.player = null;

	this.setPlayer = (p) => this.player = p;
	this.setChained = (c) => this.chained = c;

	this.getPlayer = () => this.player;
	this.getChained = () => this.chained;
}

setInterval(() => {
	Game.Players.forEach(p => {
		var g = {
			food: [],
			players: []
		},	v = p.getView();

		Game.Players.forEach(e => {
			if(v.isInView(e))
				g.players.push(e);
		})

		Game.Food.forEach(e => {
			if(v.isInView(e))
				g.food.push(e);
		})
	})
}, 1000/120)

module.exports = Game;