var Entity = require('./entity');

function NodeHandler(gameServer) {
	this.gameServer = gameServer;
}

module.exports = NodeHandler;

NodeHandler.prototype.removeNode = function(node) {
	if(node instanceof Entity.Player)
		this.removePlayer(node);
	else if(node instanceof Entity.Food)
		this.removeFood(node);
	else if(node instanceof Entity.Shard)
		this.removeShard(node);
	// 	// some shit went wrong

	this.gameServer.nodes.remove(node);

	// clear its data
	node = {};
	// this.gameServer.nodes.splice(this.gameServer.nodes.indexOf(node), 1);
}

NodeHandler.prototype.addPlayer = function(node) {
	this.gameServer.nodesPlayer.push(node);
	this.gameServer.nodes.push(node);
}

NodeHandler.prototype.removePlayer = function(node) {
	// remove from nodesFood
	this.gameServer.nodesPlayer.remove(node);
}

NodeHandler.prototype.addFood = function(node) {
	this.gameServer.nodesFood.push(node);
	this.gameServer.nodes.push(node);
}

NodeHandler.prototype.removeFood = function(node) {
	// remove from nodesFood
	this.gameServer.nodesFood.remove(node);
}

NodeHandler.prototype.addShard = function(node) {
	this.gameServer.nodesShard.push(node);
	this.gameServer.nodes.push(node);
}

NodeHandler.prototype.removeShard = function(node) {
	// remove from nodesShard
	this.gameServer.nodesShard.remove(node);
}

NodeHandler.prototype.update = function() {
	// update shit
	this.gameServer.foodHandler.update();
	this.gameServer.shardHandler.update();
	this.gameServer.playerHandler.update();
}