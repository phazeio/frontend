var Entity = require('./Entity')
	, Constants = require('../../API').Constants;

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

module.exports = Shard;