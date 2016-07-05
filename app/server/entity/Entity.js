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
function Entity(gameServer, x, y, radius) {
	var _x = x ? x : ~~(Math.random() * gameServer.config.borderSize)
		, _y = y ? y : ~~(Math.random() * gameServer.config.borderSize);

	this.x = _x;
	this.y = _y;
	this.gameServer = gameServer;
	this._id 	= createObjectID(5);	
	this.radius = radius;
	this.color 	= gameServer.randomColor();
	this.entityType = 0;

	this.updated = Date.now();
}

module.exports = Entity;