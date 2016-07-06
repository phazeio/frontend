var Entity = require('./Entity')
	, Packet = require('../packet')
	, Food = require('./Food')
	, Shard = require('./Shard');

/*
* @class Player
*/
function Player(gameServer, username, socket) {
	Entity.call(this, gameServer, null, null, gameServer.config.playerStartRadius);

	this.username = username;
	this.theta = 0;
	this.angle = 0;
	this.mana = 0;
	this.health = 100;
	this.damage = false;
	this.healing = false;
	this.mouse = {x: null, y: null};

	this.socket = socket;
	this.visibleNodes = [];

	this.impact = [];
	this.entityType = 2;

	this.elo = this.gameServer.config.playerStartElo;
}

Player.prototype.update = function() {
	this.move();
	if(this.gameServer.config.protocolVersion === 5)
		this.updateVisibleNodes();
	else
		this.calculateVisibileNodes();
	this.updated = Date.now();
	this.calculateConsumption();
}

Player.prototype.calculateAngle = function() {
	var dif = Math.abs(this.angle - this.theta);

	if (dif > Math.PI) {
		dif = (2 * Math.PI) - dif;
		this.theta += ((Math.abs(this.theta - this.angle) > Math.PI && this.angle < Math.PI) ? dif / 10 : -1 * dif / 10) + Math.PI * 2;
		this.theta %= Math.PI * 2;
	} else {
		this.theta += this.angle > this.theta ? dif / 10 : -1 * dif / 10;
	}

	return this.theta;
}

Player.prototype.updateVisibleNodes = function() {
	var newVisibileNodes = [];

	for(var j = 0; j < this.gameServer.nodes.length; j++) {
		var n = this.gameServer.nodes[j];
		if(n.x > this.x - 1000 && n.x < this.x + 1000 && n.y > this.y - 1000 && n.y < this.y + 1000 && n._id !== this._id) {
			newVisibileNodes.push(n);

			// check for spawn nodes
			if(this.visibleNodes.indexOf(n) <= -1)
				// send spawn packet
				this.sendPacket((new Packet.SpawnNode(n)).build());
		}
	}

	// find drop nodes
	for(var j = 0; j < this.visibleNodes.length; j++) {
		var node = this.visibleNodes[j];
		if(newVisibileNodes.indexOf(node) <= -1)
			// send drop packet
			this.sendPacket((new Packet.DropNode(node)).build());
		else if(node.entityType !== 0)
			this.sendPacket((new Packet.UpdateNode(node)).build());
	}

	this.visibleNodes = newVisibileNodes;

}

Player.prototype.calculateVisibileNodes = function() {
	var newVisibileNodes = [];

	for(var j = 0; j < this.gameServer.nodes.length; j++) {
		var n = this.gameServer.nodes[j];
		if(n.x > this.x - 1000 && n.x < this.x + 1000 && n.y > this.y - 1000 && n.y < this.y + 1000 && n._id !== this._id)
			newVisibileNodes.push(n);
	}

	this.sendPacket((new Packet.UpdateNodes(newVisibileNodes).build()));

	this.visibleNodes = newVisibileNodes;
}

Player.prototype.calculateConsumption = function() {
	var newVisibileNodes = this.visibleNodes;

	for(var j = 0; j < newVisibileNodes.length; j++) {
		var food = newVisibileNodes[j];

		if(!(food instanceof Food))
			continue;

		if(this.mana >= this.gameServer.config.playerMaxMana)
			continue;

		if(!this.gameServer.areOverlapping(this, food))
			continue;

		if(food.player && food.player._id === this._id)
			continue;

		this.gameServer.nodeHandler.removeNode(food);
		
		var food = new Food(this.gameServer);

		if(this.gameServer.nodesFood.length < this.gameServer.config.foodAmount)
        	this.gameServer.nodeHandler.addFood(food);

		this.eat();
	}
}

Player.prototype.eat = function() {
	// eat
	this.mana += 1;

	this.radius = this.gameServer.config.playerStartRadius + (0.15 * this.mana);

	// var r = this.gameServer.playerStartRadius + (0.2 * this.mana);
	// this.radius = r < this.gameServer.playerMaxRadius ? r : this.gameServer.playerMaxRadius;
}

/*
* move player
*/
Player.prototype.move = function() {
	var theta = this.calculateAngle();

	// if(this.y - this.radius < 0)
	// 	this.y = 0 + this.radius;

	// if(this.y + this.radius > this.gameServer.config.borderSize)
	// 	this.y = this.gameServer - this.radius;

	// if(this.x - this.radius < 0)
	// 	this.x = 0 + this.radius;

	// if(this.x + this.radius > this.gameServer.config.borderSize)
	// 	this.x = this.gameServer - this.radius;

	var y = this.y + this.gameServer.config.playerSpeed * Math.sin(theta);
	if(y - this.radius > 0 && y + this.radius < this.gameServer.config.borderSize)
		this.y += this.gameServer.config.playerSpeed * Math.sin(theta);

	var x = this.x + this.gameServer.config.playerSpeed * Math.cos(theta);
	if(x - this.radius > 0 && x + this.radius < this.gameServer.config.borderSize)
		this.x += this.gameServer.config.playerSpeed * Math.cos(theta);

	this.sendPacket((new Packet.UpdatePosition(this)).build());
}

Player.prototype.shoot = function() {
	if(this.mana - 5 < 0)
		return;

	this.mana -= 5;

	var x = this.x + this.radius * Math.cos(this.angle);
    var y = this.y + this.radius * Math.sin(this.angle);

    this.radius = this.gameServer.config.playerStartRadius + (0.15 * this.mana);
    this.gameServer.nodeHandler.addShard(new Shard(this.gameServer, x, y, this.angle, this));
}

/*
* inflict damage on player
*/
Player.prototype.inflictDamage = function(int, cause) {
	this.health -= int;
	if(this.health <= 0) {
		var killer = cause.shooter;
		var newElo = this.gameServer.calcElo(killer.elo, this.elo);
		killer.elo += newElo;
		killer.sendPacket((new Packet.Alert('You killed ' + this.username + ' +' + newElo + 'elo')).build());

		return this.die();
	}

	this.damage = true;

	setTimeout(() => this.damage = false, 150);
}

Player.prototype.heal = function() {
	if(this.mana - 5 < 0)
		return;

	if(this.health >= 100)
		return;

	this.mana -= 5;

	this.health = this.health + 4 > 100 ? 100 : this.health + 4;
	this.healing = true;

	setTimeout(() => this.healing = false, 150);
}

/*
* kill player - do this somewhere else
*/
Player.prototype.die = function() {
	// something

	for(var j = 0; j < (this.mana / 2 < this.gameServer.config.playerMaxDrops ? this.mana / 2 : this.gameServer.config.playerMaxDrops); j++)
		this.gameServer.nodeHandler.addFood(new Food(this.gameServer, (Math.random() * (this.x + this.radius)) + (this.x - this.radius), (Math.random() * (this.y + this.radius)) + (this.y - this.radius), this))

	this.sendPacket((new Packet.Die()).build());
	this.gameServer.nodeHandler.removeNode(this);
}

Player.prototype.alert = function(alert) {
	this.sendPacket((new Packet.Alert(alert)).build());
}

// possible abstraction
Player.prototype.sendPacket = function(packet) {
	try {
		this.socket.send(packet);
	} catch(err) {
		// async sending when closed issue hack fix
		if(err)
			return console.log(err);
	}
}

module.exports = Player;