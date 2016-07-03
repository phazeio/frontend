var Point = require('../Point')
	, API = require('../../API');

var key = '1234567890';
var createObjectID = (num) => {
	var str = '';
	for(var j = 0; j < num; j++)
		str += key[Math.floor(Math.random() * (key.length - 1))];

	return str;
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

module.exports = Entity;