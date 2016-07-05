function ShardHandler(gameServer) {
    this.gameServer = gameServer;
}

module.exports = ShardHandler;

ShardHandler.prototype.update = function() {
    // List through all shards and update
    for (var i = 0; i < this.gameServer.nodesShard.length; i++) {
        var shard = this.gameServer.nodesShard[i];
        if (!shard) continue;

        shard.update();
    }
};