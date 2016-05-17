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
		var p = new Player(data.username, this.socket);
		Game.Players.push(p);

		// send stuff back to player
		var player_copy = Object.assign({}, p);
		delete player_copy['socket'];

		console.log(p);

		var packet = {id: 'handshake', player: player_copy, map: Game.Map};
		p.getSocket().sendUTF(JSON.stringify(p));
	},

	move: (data) => {
		var p = Game.Players.find(data._id);
		if(p == null)
			// handle this bug!

		p.setX(data.x);
		p.setY(data.y);
	},

	/*
	* specifies when a food is eaten + if its chained
	* specifis what player ate it
	*/
	eat: (data) => {
		var f = Game.FindFood(data.Food._id);
		var p = Game.FindPlayer(data.Player._id);

		p.setScore(p.getScore() + 1);

		// specifiy if the food is being chained
		if(data.chain)
			return p.addFood(f);

		Game.RemoveFood(f);
	},

	/*
	* shoot
	*
	*/
	shoot: () => {

	},
}