var Entity = require('./Entity')
	, Constants = require('../../API').Constants;

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

module.exports = Food;