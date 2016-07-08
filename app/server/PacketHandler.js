var Entity = require('./entity');
var Packet = require('./packet');

function PacketHandler(gameServer, socket) {
    this.gameServer = gameServer;
    this.socket = socket;
    // Detect protocol version - we can do something about it later
    this.protocolVersion = 0;

    this.pressQ = false;
    this.pressW = false;
    this.pressSpace = false;
}

module.exports = PacketHandler;

PacketHandler.prototype.handleMessage = function(message) {
    if(typeof message !== 'object')
        return;

    function stobuf(buf) {
        var length = buf.length;
        var arrayBuf = new ArrayBuffer(length);
        var view = new Uint8Array(arrayBuf);

        for (var i = 0; i < length; i++) {
            view[i] = buf[i];
        }

        return view.buffer;
    }

    // Discard empty messages
    if (message.length == 0) {
        return;
    }

    var buffer = stobuf(message);
    var view = new DataView(buffer);
    var packetId = view.getUint8(0, true);

    // faulty packet
    if(packetId !== 0 && !this.socket.player)
        return;

    switch(packetId) {
        case 0:
            // handshake packet
            if(buffer.byteLength !== 27)
                return;

            if(this.gameServer.nodesPlayer.length > this.gameServer.config.maxPlayers)
                return;

            // --- HANDSHAKE ---
            if(this.socket.player) {
                var player = this.socket.player;

                this.gameServer.nodeHandler.removeNode(player);
                this.socket.close();
                return;
            }

            if ((view.byteLength + 1) % 2 == 1) {
                break;
            }
            var username = '';
            var maxLen = this.gameServer.config.playerMaxNickLength * 2; // 2 bytes per char
            for (var i = 1; i < view.byteLength; i += 2)
                username += String.fromCharCode(view.getUint16(i, true));

            var player = new Entity.Player(this.gameServer, username, this.socket);
            this.socket.player = player;
            this.gameServer.nodeHandler.addPlayer(player);

            this.socket.send((new Packet.Handshake(player)).build());
            // this.gameServer.alert(username + ' has joined.')
            break;
        case 2:
            // angle check
            if(buffer.byteLength !== 5)
                return;

            // mouse move
            // Set Target
            this.socket.player.angle = view.getFloat32(1);
            break;
        case 3:
            // shoot packet
            if(buffer.byteLength !== 1)
                return;

            var player = this.socket.player.shoot();
            break;
        case 4:
            // heal packet
            if(buffer.byteLength !== 1)
                return;

            var player = this.socket.player.heal();
            break;
    }
}