function PlayerHandler(gameServer) {
    this.gameServer = gameServer;
}

module.exports = PlayerHandler;

PlayerHandler.prototype.update = function() {
    var time = new Date();

    // List through all clients and check if update is needed
    for (var i = 0; i < this.gameServer.nodesPlayer.length; i++) {
        var player = this.gameServer.nodesPlayer[i];
        if (!player) continue;

        player.update();
    }

    // Record time needed to update clients
    this.gameServer.ticksMapUpdate = new Date() - time;
};