var Entity = require('./Entity')
	, Constants = require('../../API').Constants;

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

module.exports = Player;