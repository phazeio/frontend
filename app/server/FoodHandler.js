function FoodHandler(gameServer) {
    this.gameServer = gameServer;
}

module.exports = FoodHandler;

FoodHandler.prototype.update = function() {
    // List through all shards and update
    for (var i = 0; i < this.gameServer.nodesFood.length; i++) {
        var food = this.gameServer.nodesFood[i];
        if (!food) continue;

        // console.log(food);

        food.update();
    }
};