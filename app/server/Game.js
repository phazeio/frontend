var Entity = require('./Entities/Entity')
	, Player = require('./Entities/Player')
	, Food = require('./Entities/Food')
	, Shard = require('./Entities/Shard');


var API = require('../API');


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

module.exports.Game = Game;
module.exports.Player = Player;
module.exports.Food = Food;
module.exports.Shard = Shard;