var Game = require('./Game').Game
	Player = require('./Game').Player
	Food = require('./Game').Food;

module.exports = {
	/*
	* Handshake between client and server
	* Create Player object from data on server
	* Store Player + Socket ID in array
	*/
	handshake: (data) => {
		var p = new Player(data.username, data.socket);
		Game.Players.push(p);

		// send stuff back to player
		var player_copy = Object.assign({}, p);
		delete player_copy['socket'];

		var packet = {id: 'handshake', player: player_copy, map: Game.Map};
		p.getSocket().sendUTF(JSON.stringify(packet));
	},

	player_move: (data) => {
		var p = Game.FindPlayer(data.player._id);

		if(p == null)
			// handle this bug!

		p.setX(data.player.x);
		p.setY(data.player.y);
	},

	food_move: (data) => {
		var f = Game.FindFood(data.food._id);

		if(f == null)
			// handle this

		f.setX(data.food.x);
		f.setY(data.food.y);
		f.setRadius(data.food.radius);
	},

	/*
	* specifies when a food is eaten + if its chained
	* specifis what player ate it
	*/
	eat: (data) => {
		// console.log(data.food)
		var f = Game.FindFood(data.food._id);
		if(f === null)
			return;

		var p = Game.FindPlayer(data.player._id);

		p.setScore(p.getScore() + 1);

		// specifiy if the food is being chained
		if(p.getScore() === 0 || p.getScore() % 10 === 0)
			p.addFood(f);

		Game.RemoveFood(f);
		Game.spawnFood();
	},

	/*
	* shoot
	*
	*/
	shoot: () => {

	},
}