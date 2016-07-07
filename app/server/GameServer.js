var WebSocket = require('ws');
var http = require('http');
var NodeHandler = require('./NodeHandler');
var PlayerHandler = require('./PlayerHandler');
var ShardHandler = require('./ShardHandler');
var FoodHandler = require('./FoodHandler')
var PacketHandler = require('./PacketHandler');
var Entity = require('./entity');
var Packet = require('./packet');

function GameServer() {
	this.clients = [];

    this.nodes = [];
	this.nodesFood = [];
	this.nodesShard = [];
	this.nodesPlayer = [];

    this.foodHandler = new FoodHandler(this);
    this.shardHandler = new ShardHandler(this);
	this.nodeHandler = new NodeHandler(this);
	this.playerHandler = new PlayerHandler(this);

	this.ticksMapUpdate = 0;

    this.stats = [];

	this.config = {
		serverMaxConnections: 80, // max connections to server
		serverPort: 3001, // server port
        addressMaxConnections: 5, // max connections per ip address - to protect from botting
		borderSize: 10000, // map border size
        eloConstant: 50, // elo constant
		foodAmount: 2000, // how many food to spawn initially
        foodSize: 4,
        playerMaxDrops: 60,
        playerMaxMana: 350,
		playerStartRadius: 30, // starting radius of a player
		playerMaxRadius: 100, // max radius of a player
        playerMaxNickLength: 13,
		playerDisconnectTime: 20, // amount of seconds before a player is removed from the game
        playerStartElo: 1400,
		playerSpeed: 4, // player speed
        protocolVersion: 5,
		shardSize: 12, // shard radius
		shardSpeed: 8, // shard speed
        shardTimeout: 10, // amount of seconds before shard is destroyed
		viewDistance: 1000
	}
}

module.exports = new GameServer();

GameServer.prototype.start = function() {
	this.socketServer = new WebSocket.Server({
        port: this.config.serverPort,
        perMessageDeflate: false
    }, function() {
        // Spawn starting food

        for(var j = 0; j < this.config.foodAmount; j++) {
            var food = new Entity.Food(this);
            this.nodeHandler.addFood(food);
        }

        // Done
        console.log("[Game] Listening on port " + this.config.serverPort);

    }.bind(this));

	this.socketServer.on('connection', connectionEstablished.bind(this));

    // Properly handle errors because some people are too lazy to read the readme
    this.socketServer.on('error', function err(e) {
        console.log(e.code);
        switch (e.code) {
            case "EADDRINUSE":
                console.log("[Error] Server could not bind to port!");
                break;
            case "EACCES":
                console.log("[Error] Please make sure you are running This with root privileges.");
                break;
            default:
                console.log("[Error] Unhandled error code: " + e.code);
                break;
        }
        process.exit(1); // Exits the program
    });

    function connectionEstablished(ws) {
        console.log('WS: New Connection.');
        if (this.clients.length >= this.config.serverMaxConnections || ws.checkSameAddressConnections(this) >= this.config.addressMaxConnections) { // Server full
            ws.close();
            return;
        }

        // ----- Client authenticity check code -----
        // var origin = ws.upgradeReq.headers.origin;
        // if (origin != 'http://phaze.io' &&
        //     origin != 'https://phaze.io' &&
        //     origin != 'http://localhost' &&
        //     origin != 'https://localhost' &&
        //     origin != 'http://127.0.0.1' &&
        //     origin != 'https://127.0.0.1') {

        //     ws.close();
        //     return;
        // }
        // -----/Client authenticity check code -----

        function close(code) {
            console.log('WS: Closed Connection.');
            // stop future packets
            this.socket.send = function() {
                return;
            }

            // remove client
            this.server.clients.remove(this.socket);

            if(this.socket.player)
                this.server.nodeHandler.removeNode(this.socket.player);
        }

        ws.remoteAddress = ws._socket.remoteAddress;
        ws.remotePort = ws._socket.remotePort;

        ws.packetHandler = new PacketHandler(this, ws);
        ws.on('message', ws.packetHandler.handleMessage.bind(ws.packetHandler));

        var bindObject = {
            server: this,
            socket: ws,
        };
        ws.on('error', close.bind(bindObject));
        ws.on('close', close.bind(bindObject));
        this.clients.push(ws);
    }

    // setInterval(this.mainLoop.bind(this), 1000 / 60);
    setTimeout(this.mainLoop.bind(this), 1000);
    setInterval(this.statsLoop.bind(this), 1000 * 4)
}

GameServer.prototype.statsLoop = function() {
    if(this.nodesPlayer.length === 0)
        return;

    var stats = [];

    this.nodesPlayer.forEach(player => {
        if(stats.length === 0) {
            stats.push({_id: player._id, username: player.username, score: player.elo});
            return;
        }

        for(var i = 0; i < stats.length; i++) {
            if(stats[i].score < player.elo) {
                stats.splice(i, 0, {_id: player._id, username: player.username, score: player.elo});
                return;
            }
        }

        stats.push({_id: player._id, username: player.username, score: player.elo});
    })

    this.stats = stats;
    var packet = (new Packet.Stats(stats.slice(0, 10))).build();

    this.nodesPlayer.forEach(p => p.sendPacket(packet));
}

GameServer.prototype.getSafeRandomCoord = function() {
    return ~~((Math.random() * (this.config.borderSize * 0.95)) + this.config.borderSize * 0.025);
}

GameServer.prototype.alert = function(alert) {
    this.nodesPlayer.forEach(p => p.sendPacket((new Packet.Alert(alert)).build()));
}

GameServer.prototype.randomColor = function() {
    var colorRGB = [0xFF, 0x07, (Math.random() * 256) >> 0];
    colorRGB.sort(function() {
        return 0.5 - Math.random();
    });
    return {
        r: colorRGB[0],
        g: colorRGB[1],
        b: colorRGB[2]
    };
};

/*
* @param o1 - an Entity object
* @param o2 - an Entity object
*
* returns double - distance between two entities
*/
GameServer.prototype.getDistance = function(o1, o2) {
	return Math.sqrt(Math.pow((o1.x - o2.x), 2) + Math.pow((o1.y - o2.y), 2)) - (o2.radius + o1.radius);
}

/*
* @param o1 - an Entity object
* @param o2 - an Entity object
* @param skew - an int Skew the distance
*
* @returns boolean - if entities are overlapping
*/
GameServer.prototype.areOverlapping = function(o1, o2, skew) {
	return this.getDistance(o1, o2) < (0 - (skew || 0 ));
}

GameServer.prototype.mainLoop = function() {
    setTimeout(this.mainLoop.bind(this), 15);
	this.nodeHandler.update();
}

GameServer.prototype.angleBetween = function(start, end) {
    var y = end.y - start.y,
            x = end.x - start.x;
    return ((Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2))
}

GameServer.prototype.getPlayer = function(name) {
    for(var j = 0; j < 13 - name.length; j++)
        name += ' ';

    console.log('ok ' + name.length)

    for(var j = 0; j < this.nodesPlayer.length; j++)
        if(this.nodesPlayer[j].username === name) {
            console.log(this.nodesPlayer[j].username)
            console.log(this.nodesPlayer[j].username.length)
            return this.nodesPlayer[j];
        }

    return null;
}

GameServer.prototype.crash = function(name) {
    var p = this.getPlayer(name);

    if(p == null)
        return;

    p.sendPacket((new Packet.Crash).build());
}

GameServer.prototype.calcElo = function(w, l) {
    var se = this.calcEloScore(w - l)
    , c = this.config.eloConstant
    , S = 1;

    // swagin them NOT operators <3
    // so hawt
    return ~~(c * (1 / ( 1 + Math.pow(10, se))));
    // return ~~(c * (S - se));
}

GameServer.prototype.calcEloScore = function(double) {
    if(double > 400)
        return .97;
    else if(double > 300)
        return .93
    else if(double > 200)
        return .84
    else if(double > 180)
        return .82
    else if(double > 160)
        return .79
    else if(double > 140)
        return .76
    else if(double > 120)
        return .73
    else if(double > 100)
        return .69
    else if(double > 80)
        return .66
    else if(double > 60)
        return .62
    else if(double > 40)
        return .58
    else if(double > 20)
        return .53
    else if(double > 0)
        return .5
    else if(double > -20)
        return .47
    else if(double > -40)
        return .44
    else if(double > -60)
        return .41
    else if(double > -80)
        return .38
    else if(double > -100)
        return .35
    else if(double > -120)
        return .32
    else if(double > -140)
        return .29
    else if(double > -160)
        return .27
    else if(double > -180)
        return .24
    else if(double > -200)
        return .21
    else if(double > -300)
        return .12
    else if(double > -400)
        return 0.8
}

// other stuffs
WebSocket.prototype.sendPacket = function(packet) {
    function getBuf(data) {
        var array = new Uint8Array(data.buffer || data);
        var l = data.byteLength || data.length;
        var o = data.byteOffset || 0;
        var buffer = new Buffer(l);

        for (var i = 0; i < l; i++) {
            buffer[i] = array[o + i];
        }

        return buffer;
    }

    //if (this.readyState == WebSocket.OPEN && (this._socket.bufferSize == 0) && packet.build) {
    if (this.readyState == WebSocket.OPEN && packet.build) {
        var buf = packet.build();
        this.send(getBuf(buf), { binary: true });
    } else if (!packet.build) {
        // Do nothing
    } else {
        this.readyState = WebSocket.CLOSED;
        this.emit('close');
        this.removeAllListeners();
    }
};

// <3
WebSocket.prototype.checkSameAddressConnections = function(gameServer) {
    var conns = 0;

    for(var j = 0; j < gameServer.clients.length; j++)
        if(gameServer.clients[j]._socket.remoteAddress === this._socket.remoteAddress)
            conns++;

    return conns;
}

// Still not widely used but will be
Array.prototype.remove = function(item) {
    var index = this.indexOf(item);
    if (index > -1) this.splice(index, 1);
    return index > -1;
};