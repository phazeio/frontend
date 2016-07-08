var Entity = require('./Entity');

/*
* @class Shard
*/
function Shard(gameServer, x, y, angle, player) {
	Entity.call(this, gameServer, x, y, gameServer.config.shardSize);

	this.angle = angle;
	this.shooter = player;
	this.createdAt = Date.now();
	this.entityType = 1;
	this.color = {
		r: 255,
		g: 80,
		b: 80
	}
}

module.exports = Shard;

Shard.prototype.update = function() {
	this.checkCollision();
	this.move();
	this.updated = Date.now();
	if(this.updated - this.createdAt > this.gameServer.config.shardTimeout * 1000)
		this.gameServer.nodeHandler.removeNode(this);
}

Shard.prototype.checkCollision = function() {
	for(var j = 0; j < this.gameServer.nodesPlayer.length; j++) {
		var player = this.gameServer.nodesPlayer[j];

		if(!this.gameServer.areOverlapping(player, this) || player._id === this.shooter._id)
			continue;

		this.gameServer.nodeHandler.removeNode(this);
		player.inflictDamage(8, this);
	}
}

Shard.prototype.move = function() {
	var y = this.y - this.radius + this.gameServer.config.shardSpeed * Math.sin(this.angle);
	if(y > 0 && y < this.gameServer.config.borderSize)
		this.y += this.gameServer.config.shardSpeed * Math.sin(this.angle);
	var x = this.x - this.radius + this.gameServer.config.shardSpeed * Math.cos(this.angle);
	if(x > 0 && x < this.gameServer.config.borderSize)
		this.x += this.gameServer.config.shardSpeed * Math.cos(this.angle);
}