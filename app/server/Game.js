var API = require('../API')
	, key = '1234567890';


var createObjectID = (num) => {
	var str = '';
	for(var j = 0; j < num; j++)
		str += key[Math.floor(Math.random() * (key.length - 1))];

	return str;
}

var Game = {};
var Constants = API.Constants;

Game.start = function(http) {
	require('./sockets').startWebSocketServer(http);

	for(var j = 0; j < Constants.MAP_SIZE / 5; j++) {
		Game.spawnFood();
	}

	// check collission
	setInterval(() => {
		Game.Players.forEach(p => {
			for(var j = 0; j < Game.Shards.length; j++) {
				if(!API.areOverlapping(Game.Shards[j], p, 10) || Game.Shards[j].shooter_id === p._id)
					continue;

				p.health -= 100;
				if(p.health <= 0) {
					Game.FindPlayer(Game.Shards[j].shooter_id).socket.sendUTF(JSON.stringify({id: 'alert', alert: 'You killed ' + (p.username ? p.username + '.' : ' an unnamed shooter.')}))
					p.die();
				} else {
					p.damage = true;
					setTimeout(() => p.damage = false, 200);
				}


				Game.Shards.splice(j, 1);
				j--;
			}
		})
	});

	// leaderboard
	setInterval(() => {
		Game.Leaderboard = [];

		Game.Players.forEach(p => {
			if(!p)
				return; 

			if(Game.Leaderboard.length === 0) {
				Game.Leaderboard.push({username: p.username, score: p.score});
				return;
			}

			for(var j = 0; j < Game.Leaderboard.length; j++) {
				if(Game.Leaderboard[j].score < p.score) {
					Game.Leaderboard.splice(j, 0, {username: p.username, score: p.score});
					return;
				}
			}

			Game.Leaderboard.push({username: p.username, score: p.score});
		});


		var leaderboard = [];

		if(Game.Leaderboard.length > 10)
			leaderboard = Game.Leaderboard.slice(0, 11);
		else if(Game.Leaderboard.length > 0)
			leaderboard = Game.Leaderboard;

		Game.Players.forEach(p => {
			if(!p)
				return;

			p.socket.sendUTF(JSON.stringify({id: 'rankings', leaderboard: leaderboard}))
		});
	}, 2000)

	// game loop
	setInterval(() => {
		for(var j = 0; j < Game.Shards.length; j++) {
			Game.Shards[j].move();
			Game.Shards[j].updated = Date.now();

			if(Date.now() - Game.Shards[j].createdAt < 15000)
				continue;

			Game.Shards.splice(j, 1);
			j--;
		}

		Game.Players.forEach(p => {
			if(!p)
				return;

			p.radius = Constants.PLAYER_RADIUS + (0.2 * p.getScore());
			p.move();
			p.updated = Date.now();
			var player_copy = Object.assign({}, p);
			delete player_copy['socket'];

			var g = {
				food: [],
				players: [],
				shards: [],
				player: player_copy,
			},	v = getView(p);

			// load players too
			Game.Food.forEach(e => {
				if(v.isInView(e))
					g.food.push(e);
			});

			Game.Shards.forEach(e => {
				if(v.isInView(e))
					g.shards.push(e);
			});

			Game.Players.forEach(e => {
				if(v.isInView(e)) {
					if(e._id === p._id)
						return;

					var pl = Object.assign({}, e);
					delete pl['socket'];

					g.players.push(pl);
				}
			})

			p.socket.sendUTF(JSON.stringify({id: 'game', update: g}));
		})
	}, 1000/60)
}

// array of entities
Game.Food = [];
Game.Shards = [];
Game.Players = [];
Game.Map = new Map(Constants.MAP_SIZE, Constants.MAP_SIZE);
Game.Leaderboard = [];

Game.FindFood = (_id) => {
	var f = null;
	Game.Food.forEach(e => {
		if(e.get_id() == _id)
			return f = e;
	})

	return f;
}

Game.spawnFood = function() {
	Game.Food.push(new Food(API.randomColor()));
}

Game.RemoveFood = function(e) {
	Game.Food.splice(Game.Food.indexOf(e), 1);
}

Game.FindPlayer = (_id) => {
	var p = null;
	Game.Players.forEach(e => {
		// if(e._id === _id) {
			if(e._id === _id) 
				return p = e;
			// return e;
		// }
	})

	return p;
}

Game.RemovePlayer = function(e) {
	Game.Players.splice(Game.Players.indexOf(e), 1);
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

	this.getWidth = () => this.width;
	this.getHeight = () => this.height;
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
	this._id 	= createObjectID(16);	
	this.radius = radius;
	this.color 	= API.randomColor();

	// set id
	this.set_id = (_id) => this._id = _id;

	this.setX = x => this.x = x;
	this.setY = y => this.y = y;
	this.setColor = c => this.color = c;
	this.setRadius = r => this.radius = r;

	this.get_id = () => this._id;
	this.getX = () => this.x;
	this.getY = () => this.y;
	this.getColor = () => this.color;
	this.getRadius = () => this.radius;
}

/*
* @class Player
*/
function Player(username, socket) {
	Entity.call(this, ~~((Math.random() * 300) + Constants.MAP_SIZE / 3), ~~((Math.random() * 300) + Constants.MAP_SIZE / 3), Constants.PLAYER_RADIUS);
	this.food = [];
	this.angle = 0;
	this.score = 0;
	this.username = username;
	this.socket = socket;
	this.impact = [];
	this.speed = 4;
	this.radius = Constants.PLAYER_RADIUS;
	this.health = 100;
	this.damage = false;
	this.updated = Date.now();

	this.getScore = () => this.score;
	this.getUsername = () => this.username;
	this.getFood = () => this.food;
	this.getSocket = () => this.socket;
	this.getAngle = () => this.angle;
	this.getHealth = () => this.health;
 
	this.setScore = s => this.score = s;
	this.setUsername = u => this.username = u;
	this.setAngle = a => this.angle = a;
	this.setHealth = h => this.health = h;

	/*
	* move player
	*/
	this.move = () => {
		var y = this.y + this.speed * Math.sin(this.angle);
		if(y - this.radius > 0 && y + this.radius < Constants.MAP_SIZE)
			this.y += this.speed * Math.sin(this.angle);

		var x = this.x + this.speed * Math.cos(this.angle);
		if(x - this.radius > 0 && x + this.radius < Constants.MAP_SIZE)
			this.x += this.speed * Math.cos(this.angle);

		// EMIT MOVE EVENT
		// SpermEvent.emit('player_move_event', {player: this});
	}
}

Player.prototype.die = function() {
	this.socket.sendUTF(JSON.stringify({id: 'die'}));

	for(var j = 0; j < this.getScore() / 2; j++)
		Game.Food.push(new Food(null, (Math.random() * (this.x + this.radius)) + (this.x - this.radius), (Math.random() * (this.y + this.radius)) + (this.y - this.radius)))

	this.socket.close();
	Game.RemovePlayer(this);
}

// Player.prototype.getView = () => {
// 	return new View(this.y - VIEW_DISTANCE, 
// 		this.y + VIEW_DISTANCE, 
// 		this.x - VIEW_DISTANCE, 
// 		this.y - VIEW_DISTANCE);
// }

Player.prototype.addFood = function(f) {
	f.setChained(true);
	this.food.push(f)
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


function getView(e) {
	return new View(e.y - Constants.VIEW_DISTANCE, e.y + Constants.VIEW_DISTANCE, e.x + Constants.VIEW_DISTANCE, e.x - Constants.VIEW_DISTANCE);
}

/*
* @param r - object that implments Point class
* returns boolean
*/
View.prototype.isInView = function(r) {
	if(r.x > this.leftX && r.x < this.rightX && r.y > this.topY && r.y < this.bottomY)
		return true;

	return false;
}

/*
* @class Food
*/
function Food(color, x, y) {
	var _x = x !== undefined ? x : ~~(Math.random() * Constants.MAP_SIZE)
		, _y = y !== undefined ? y : ~~(Math.random() * Constants.MAP_SIZE);

	Entity.call(this, _x, _y, Constants.FOOD_RADIUS);
	this.chained = false;
	this.player = null;

	this.setPlayer = (p) => this.player = p;
	this.setChained = (c) => this.chained = c;

	this.getPlayer = () => this.player;
	this.getChained = () => this.chained;
}

/*
* @class Shard
*/
function Shard(x, y, angle, s_id) {
	Entity.call(this, x, y, 10);

	this.color = '#ff5050';
	this.angle = angle;
	this.shooter_id = s_id;
	this.createdAt = Date.now();
	this.updated = Date.now();

	this.move = () => {
		if(this.y - this.radius + Constants.SHARD_SPEED * Math.sin(this.angle) > 0)
			this.y += Constants.SHARD_SPEED * Math.sin(this.angle);

		if(this.x - this.radius + Constants.SHARD_SPEED * Math.cos(this.angle) > 0)
			this.x += Constants.SHARD_SPEED * Math.cos(this.angle);
	}
}

module.exports.Game = Game;
module.exports.Player = Player;
module.exports.Food = Food;
module.exports.Shard = Shard;