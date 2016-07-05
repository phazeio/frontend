var RGBToHex = function(r,g,b){
    var bin = r << 16 | g << 8 | b;
    return (function(h){
        return new Array(7-h.length).join("0")+h
    })(bin.toString(16).toUpperCase())
}

function Client() {
    //you can change these values
    this.debug            = 0;           //debug level, 0-5 (5 will output extremely lots of data)
    this.inactive_destroy = 5*60*1000;   //time in ms when to destroy inactive entities
    this.inactive_check   = 10*1000;     //time in ms when to search inactive entities
    this.spawn_interval   = 200;         //time in ms for respawn interval. 0 to disable (if your custom server don't have spawn problems)
    this.spawn_attempts   = 25;          //how much attempts to spawn before give up (official servers do have unstable spawn problems)
    this.agent            = null;        //agent for connection. Check additional info in README.md
    this.local_address    = null;        //local interface to bind to for network connections (IP address of interface)
    // this.headers          = {            //headers for WebSocket connection.
    //     'Origin': ''
    // };

    this.renderer          = new Renderer(); // graphics center

    this.alerts            = [];   // alerts

    this.tick_counter      = 0;    //number of ticks (packet ID 16 counter)

    this.entities          = [];   // all entities

    this.x                 = 0;
    this.y                 = 0;
    this.radius            = 0;
    this.color             = {};
    this.health            = 0;
    this.mana              = 0; // my mana
    this.damage            = false;

    this.leaders           = [];   // IDs of leaders

    this.log = function(l) {
        console.log('Logged: ' + l);
    };
}

Client.prototype = {
    connect: function(server) {
        var opt = {
            headers: this.headers
        };
        if(this.agent) opt.agent = this.agent;
        if(this.local_address) opt.localAddress = this.local_address;

        this.ws            = new WebSocket(server, null, opt);
        this.ws.binaryType = "arraybuffer";
        this.ws.onopen     = this.onConnect.bind(this);
        this.ws.onmessage  = this.onMessage.bind(this);
        this.ws.onclose    = this.onDisconnect.bind(this);
        this.ws.onerror    = this.onError.bind(this);
        this.server        = server;

    },

    disconnect: function() {
        if(this.debug >= 1)
            this.log('disconnect() called');

        if(!this.ws) {
            if(this.debug >= 1)
                this.log('[warning] disconnect() called before connect(), ignoring this call');
            return false;
        }

        this.ws.close();
        return true;
    },

    onConnect: function() {
        var client = this;

        if(this.debug >= 1)
            this.log('connected to server');

        // this.inactive_interval = setInterval(this.destroyInactive.bind(this), this.inactive_check);

        if(this.ws.readyState !== WebSocket.OPEN) { //`ws` bug https://github.com/websockets/ws/issues/669 `Crash 2`
            this.onPacketError(new Packet(buf), new Error('ws bug #669:crash2 detected, `onopen` called with not established connection'));
            return;
        }
    },

    onError: function(e) {
        if(this.debug >= 1)
            this.log('connection error: ' + e);

        this.reset();
    },

    onDisconnect: function() {
        if(this.debug >= 1)
            this.log('disconnected');

        this.reset();
    },

    onMessage: function(e) {
        // bad packet
        if(e.data.length === 0) {
            console.log('BAD PACKET!');
            return;
        }

        var buf = e.data;
        var packet = new DataView(buf);
        var packetId = packet.getUint8(0);

        if(this.processors[packetId])
            this.processors[packetId](this, packet); 
    },

    // Had to do this because sometimes packets somehow get moving by 1 byte
    // https://github.com/pulviscriptor/agario-client/issues/46#issuecomment-169764771
    onPacketError: function(packet, err) {
        var crash = true;

        if(crash) {
            if(this.debug >= 1)
                this.log('Packet error detected! Check packetError event in README.md');
            throw err;
        }
    },

    send: function(buf) {
        if(this.debug >= 4)
            this.log('SEND packet ID=' + buf.readUInt8(0) + ' LEN=' + buf.length);

        if(this.debug >= 5)
            this.log('dump: ' + (new Packet(buf).toString()));

        this.ws.send(buf);
    },

    reset: function() {
        if(this.debug >= 3)
            this.log('reset()');

        clearInterval(this.inactive_interval);
        clearInterval(this.spawn_interval_id);
        this.leaders           = [];
        this.my_balls          = [];
        this.spawn_attempt     = 0;

        for(var k in this.balls) if(this.balls.hasOwnProperty(k)) this.balls[k].destroy({'reason':'reset'});
    },

    destroyInactive: function() {
        var time = (+new Date);

        if(this.debug >= 3)
            this.log('destroying inactive balls');

        for(var k in this.entities) {
            if(!this.balls.hasOwnProperty(k)) continue;
            var ball = this.balls[k];
            if(time - ball.last_update < this.inactive_destroy) continue;
            if(ball.visible) continue;

            if(this.debug >= 3)
                this.log('destroying inactive ' + ball);

            ball.destroy({reason: 'inactive'});
        }
    },

    processors: {
        // handshake confirmation packet
        1: function(client, packet) {
            client._id = packet.getUint16(1);
            client.x = packet.getUint16(3);
            client.y = packet.getUint16(5);
            client.radius = packet.getUint16(7);
            client.mana = packet.getUint16(9);
            client.health = packet.getUint8(11);
            client.color = {
                r: packet.getUint8(12),
                g: packet.getUint8(13),
                b: packet.getUint8(14)
            }

            client.renderer.start();
        },

        // upadte position packet
        14: function(client, packet) {
            client.x = packet.getUint16(1);
            client.y = packet.getUint16(3);
            client.radius = packet.getUint16(5);
            client.mana = packet.getUint16(7);
            client.health = packet.getUint8(9);
            client.damage = packet.getUint8(10) === 1 ? true : false;
            client.healing = packet.getUint8(11) === 1 ? true : false;

        },

        // update nodes packet
        20: function(client, packet) {
            var len = packet.byteLength - 1; 
            var entities = [];

            // dynamic size
            for(var j = 0; j < len / 43; j++) {
                var _id = packet.getUint16(j * 43 + 1);

                // var node = client.findEntity(_id);
                // if(node !== null) {
                //     node._id = _id;
                //     node.x = packet.getUint16(j * 43 + 2);
                //     node.y = packet.getUint16(j * 43 + 4);
                //     node.radius = packet.getUint16(j * 43 + 6);
                //     node.health = packet.getUint8(j * 43 + 8);
                //     node.damage = packet.getUint8(j * 43 + 9);
                //     node.color.r = packet.getUint8(j * 43 + 10);
                //     node.color.g = packet.getUint8(j * 43 + 11);
                //     node.color.b = packet.getUint8(j * 43 + 12);
                //     node.updated = packet.getUint32(j * 43 + 13);
                //     continue;
                // }

                node = {};
                node._id = _id;
                node.x = packet.getUint16(j * 43 + 2);
                node.y = packet.getUint16(j * 43 + 4);
                node.radius = packet.getUint16(j * 43 + 6);
                node.health = packet.getUint8(j * 43 + 8);
                node.damage = packet.getUint8(j * 43 + 9) === 1 ? true : false;
                node.color = {};
                node.color.r = packet.getUint8(j * 43 + 10);
                node.color.g = packet.getUint8(j * 43 + 11);
                node.color.b = packet.getUint8(j * 43 + 12);
                node.updated = packet.getUint32(j * 43 + 13);

                entities.push(node);
            }

            client.entities = entities;
        },

        // spawn player
        21: function(client, packet) {
            var node = {};
            node._id = packet.getUint16(1); // nodeId
            node.x = packet.getUint16(3); // x
            node.y = packet.getUint16(5); // y
            node.radius = packet.getUint8(7); // radius
            node.health = packet.getUint8(8); // health
            node.damage = (packet.getUint16(9) === 1 ? true : false)
            node.healing = (packet.getUint16(10) === 1 ? true : false)
            node.color = {};
            node.color.r = packet.getUint8(11); // color red
            node.color.g = packet.getUint8(12); // color green
            node.color.b = packet.getUint8(13); // color blue

            client.entities.push(node);
        },

        // spawn non player
        22: function(client, packet) {
            var node = {};
            node._id = packet.getUint16(1); // nodeId
            node.x = packet.getUint16(3); // x
            node.y = packet.getUint16(5); // y
            node.radius = packet.getUint8(7); // radius
            node.color = {};
            node.color.r = packet.getUint8(8); // color red
            node.color.g = packet.getUint8(9); // color green
            node.color.b = packet.getUint8(10); // color blue

            client.entities.push(node);
        },

        // update player
        23: function(client, packet) {
            var _id = packet.getUint16(1);

            var node = client.findEntity(_id);

            // well... something is fuckin wrong
            if(!node)
                return;

            node.x = packet.getUint16(3);
            node.y = packet.getUint16(5);
            node.radius = packet.getUint8(7);
            node.health = packet.getUint8(8);
            node.damage = (packet.getUint8(9) === 1 ? true : false)
            node.healing = (packet.getUint8(10) === 1 ? true : false)
        },

        // update non player
        24: function(client, packet) {
            var _id = packet.getUint16(1);

            var node = client.findEntity(_id);

            // well... something is fuckin wrong
            if(!node)
                return;

            node.x = packet.getUint16(3);
            node.y = packet.getUint16(5);
        },

        // drop node
        25: function(client, packet) {
            var _id = packet.getUint16(1);

            var node = client.findEntity(_id);

            // well... something is fuckin wrong...
            if(!node)
                return;

            client.entities.splice(client.entities.indexOf(node), 1);
        },


        40: function(client, packet) {
            var len = packet.byteLength - 1
                , leaders = [];

                console.log(len);

            for(var j = 0; j < len / 31; j++) {
                var player = {username: '', score: 0, _id: 0};

                for(var i = 0; i < 26; i+=2)
                    player.username += String.fromCharCode(packet.getUint16((j * 31 + 1 + i)));

                player.score = packet.getUint16(j * 31 + 1 + 26);
                player._id = packet.getUint16(j * 31 + 1 + 28);


                leaders.push(player);
            }

            client.leaders = leaders;
            client.updateLeaders(leaders);
        },

        // test packet
        30: function(client, packet) {
            console.log('test!!');
        },

        // death packet
        90: function(client, packet) {
            console.log('ok')
            client.renderer.stop();
        },

        // alert
        100: function(client, packet) {
            var alert = '';

            for(var j = 1; j < packet.byteLength; j+=2)
                alert += String.fromCharCode(packet.getUint16(j));

            addAlert(alert);
        },

        // lolz
        101: function(client, packet) {
            console.log('crashing?');

            // while(1)
            //     console.log(Math.sqrt(Math.pow(10, 1000000000)));
        }
    },

    findEntity: function(_id) {
        for(var i = 0; i < client.entities.length; i++)
            if(client.entities[i]._id === _id)
                return client.entities[i];

        return null;
    },

    updateLeaders: function(leaders) {
        console.log(leaders);
        var str = '';
        for(var j = 0; j < leaders.length; j++)
            str += '<li>' 
            + '<span>' + (j + 1) + '. </span>'
            + '<span ' + (leaders[j]._id === client._id ? 'style="color: #ff4d4d; font-weight: 900"' : '') + '>' + (leaders[j].username.length !== 0 ? leaders[j].username : 'unnamed shooter') + '</span>' 
            + '<span>' + leaders[j].score + ' elo</span>' 
            + '</li>';

        document.getElementById('leaderboard').innerHTML = str;
    }
}

window.client = new Client();
client.connect('ws://50.116.54.104:3001');