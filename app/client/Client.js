var RGBToHex = function(r,g,b){
    var bin = r << 16 | g << 8 | b;
    return (function(h){
        return new Array(7-h.length).join("0")+h
    })(bin.toString(16).toUpperCase())
}

function Client() {
    //you can change these values
    this.debug            = 5;           //debug level, 0-5 (5 will output extremely lots of data)
    this.inactive_destroy = 5*60*1000;   //time in ms when to destroy inactive entities
    this.inactive_check   = 10*1000;     //time in ms when to search inactive entities
    this.spawn_interval   = 200;         //time in ms for respawn interval. 0 to disable (if your custom server don't have spawn problems)
    this.spawn_attempts   = 25;          //how much attempts to spawn before give up (official servers do have unstable spawn problems)
    this.agent            = null;        //agent for connection. Check additional info in README.md
    this.local_address    = null;        //local interface to bind to for network connections (IP address of interface)
    // this.headers          = {            //headers for WebSocket connection.
    //     'Origin': ''
    // };

    this.inGame            = false;
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

    setTimeout(this.loadServer.bind(this), 3000);
}

Client.prototype = {
    loadServer: function() {
        var http = new XMLHttpRequest();
        var url = "/get-server";

        http.onreadystatechange = function() {
            if (http.readyState == 4 && http.status == 200) {
                setupGame(http.responseText);
            }
        };
        http.open("GET", url, true);
        http.send();

        var self = this;

        function setupGame(x) {
            var info;
            try {
                info = JSON.parse(x);
            } catch(error) {
                return setTimeout(self.loadServer.bind(client), 3000);
            }

            console.log(info.server);
            // console.log('loading...')

            // setup game
            // x = x.split('"');
            // x = x[1];

            var nick = document.getElementById('nickname')
            nick.placeholder = 'Nickname';
            nick.disabled = false;

            var playBtn = document.getElementById('play_button');
            playBtn.disabled = false;
            playBtn.className = 'enabled';

            client.connect('ws://' + info.server);
        }
    },

    connect: function(server) {
        console.log(this);
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

        if(this.ws.readyState !== WebSocket.OPEN) { //`ws` bug https://github.com/websockets/ws/issues/669 `Crash 2`
            console.log('Crashed...?');
            return;
        }
    },

    onError: function(e) {
        if(this.debug >= 1)
            this.log('connection error: ' + e);
    },

    onDisconnect: function() {
        if(this.debug >= 1)
            this.log('disconnected');

        this.renderer.stop();
        startConnecting();
        setTimeout(this.loadServer, 3000);
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
    onPacketError: function(packet, err) {
        var crash = true;

        if(crash) {
            if(this.debug >= 1)
                this.log('Packet error');
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

        this.renderer.stop();
        clearInterval(conInt);
        this.entities          = [];
        this.spawn_attempt     = 0;

        // for(var k in this.balls) if(this.balls.hasOwnProperty(k)) this.balls[k].destroy({'reason':'reset'});
    },

    processors: {
        // handshake confirmation packet
        1: function(client, packet) {
            client._id          = packet.getUint16(1);
            client.x            = packet.getUint16(3);
            client.y            = packet.getUint16(5);
            client.radius       = packet.getUint16(7);
            client.mana         = packet.getUint16(9);
            client.health       = packet.getUint8(11);
            client.color        = {
                r: packet.getUint8(12),
                g: packet.getUint8(13),
                b: packet.getUint8(14)
            }

            client.renderer.start();

            // music.volume = 0.5;
            // music.play();
            this.inGame         = true;
        },

        // upadte position packet
        14: function(client, packet) {
            client.x            = packet.getUint16(1);
            client.y            = packet.getUint16(3);
            client.radius       = packet.getUint16(5);
            client.mana         = packet.getUint16(7);
            client.health       = packet.getUint8(9);
            client.damage       = packet.getUint8(10) === 1 ? true : false;
            client.healing      = packet.getUint8(11) === 1 ? true : false;

        },

        // update nodes packet
        20: function(client, packet) {
            var len         = packet.byteLength - 1,
                entities    = [];

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

                node            = {};
                node._id        = _id;
                node.x          = packet.getUint16(j * 43 + 2);
                node.y          = packet.getUint16(j * 43 + 4);
                node.radius     = packet.getUint16(j * 43 + 6);
                node.health     = packet.getUint8(j * 43 + 8);
                node.damage     = packet.getUint8(j * 43 + 9) === 1 ? true : false;
                node.color      = {};
                node.color.r    = packet.getUint8(j * 43 + 10);
                node.color.g    = packet.getUint8(j * 43 + 11);
                node.color.b    = packet.getUint8(j * 43 + 12);
                node.updated    = packet.getUint32(j * 43 + 13);

                entities.push(node);
            }

            client.entities = entities;
        },

        // spawn player
        21: function(client, packet) {
            var node            = {};
            node._id            = packet.getUint16(1); // nodeId
            node.x              = packet.getUint16(3); // x
            node.y              = packet.getUint16(5); // y
            node.radius         = packet.getUint8(7); // radius
            node.health         = packet.getUint8(8); // health
            node.damage         = (packet.getUint16(9) === 1 ? true : false)
            node.healing        = (packet.getUint16(10) === 1 ? true : false)
            node.color          = {};
            node.color.r        = packet.getUint8(11); // color red
            node.color.g        = packet.getUint8(12); // color green
            node.color.b        = packet.getUint8(13); // color blue

            client.entities.push(node);
        },

        // spawn non player
        22: function(client, packet) {
            var node            = {};
            node._id            = packet.getUint16(1); // nodeId
            node.x              = packet.getUint16(3); // x
            node.y              = packet.getUint16(5); // y
            node.radius         = packet.getUint8(7); // radius
            node.color          = {};
            node.color.r        = packet.getUint8(8); // color red
            node.color.g        = packet.getUint8(9); // color green
            node.color.b        = packet.getUint8(10); // color blue

            client.entities.push(node);
        },

        // update player
        23: function(client, packet) {
            var _id             = packet.getUint16(1);

            var node            = client.findEntity(_id);

            // well... something is fuckin wrong
            if(!node)
                return;

            node.x              = packet.getUint16(3);
            node.y              = packet.getUint16(5);
            node.radius         = packet.getUint8(7);
            node.health         = packet.getUint8(8);
            node.damage         = (packet.getUint8(9) === 1 ? true : false)
            node.healing        = (packet.getUint8(10) === 1 ? true : false)
        },

        // update non player
        24: function(client, packet) {
            var _id             = packet.getUint16(1);

            var node            = client.findEntity(_id);

            // well... something is fuckin wrong
            if(!node)
                return;

            node.x              = packet.getUint16(3);
            node.y              = packet.getUint16(5);
        },

        // update v2
        25: function(client, packet) {
            var players         = packet.getUint8(1)
                , nonPlayers    = (packet.buffer.byteLength - players * 10 - 2) / 6;

            for(var j = 0; j < players; j++) {
                var _id         = packet.getUint16(j * 10 + 2)
                    , node      = client.findEntity(_id);

                // well... something is fuckin wrong
                if(!node)
                    return;

                node.x          = packet.getUint16(j * 10 + 4);
                node.y          = packet.getUint16(j * 10 + 6);
                node.radius     = packet.getUint8(j * 10 + 8);
                node.health     = packet.getUint8(j * 10 + 9);
                node.damage     = (packet.getUint8(j * 10 + 10) === 1 ? true : false)
                node.healing    = (packet.getUint8(j * 10 + 11) === 1 ? true : false)
            }


            for(var j = 0; j < nonPlayers; j++) {
                var _id         = packet.getUint16(j * 6 + (10 * players) + 2) // nodeId
                    , node      = client.findEntity(_id);

                if(!node)
                    return;

                node.x          = packet.getUint16(j * 6 + (10 * players) + 4); // x
                node.y          = packet.getUint16(j * 6 + (10 * players) + 6); // y
            }
        },

        // drop node
        30: function(client, packet) {
            var _id             = packet.getUint16(1);

            var node            = client.findEntity(_id);

            // well... something is fuckin wrong...
            if(!node)
                return;


            client.entities.splice(client.entities.indexOf(node), 1);
        },


        // leaderboard
        40: function(client, packet) {
            var len             = packet.byteLength - 1
                , leaders       = [];


            for(var j = 0; j < len / 31; j++) {
                var player = {username: '', score: 0, _id: 0};

                for(var i = 0; i < 26; i+=2)
                    player.username += String.fromCharCode(packet.getUint16((j * 31 + 1 + i)));

                player.score    = packet.getUint16(j * 31 + 1 + 26);
                player._id      = packet.getUint16(j * 31 + 1 + 28);


                leaders.push(player);
            }

            client.leaders      = leaders;
            client.updateLeaders(leaders);
        },

        // death packet
        90: function(client, packet) {
            this.inGame         = false;
            client.renderer.stop();
        },

        // alert
        100: function(client, packet) {
            var alert           = '';

            for(var j = 1; j < packet.byteLength; j+=2)
                alert += String.fromCharCode(packet.getUint16(j));

            addAlert(alert);
        },

        // lolz
        101: function(client, packet) {
            while(1)
                console.log(Math.sqrt(Math.pow(10, 1000000000)));
        }
    },

    findEntity: function(_id) {
        for(var i = 0; i < client.entities.length; i++)
            if(client.entities[i]._id === _id)
                return client.entities[i];

        return null;
    },

    updateLeaders: function(leaders) {
        var str = '';
        for(var j = 0; j < leaders.length; j++)
            str += '<li>' 
            + '<span>' + (j + 1) + '. </span>'
            + '<span ' + (leaders[j]._id === client._id ? 'style="color: #ff4d4d; font-weight: 900"' : '') + '>' + this.validateName(leaders[j].username) + '</span>' 
            + '<span>' + leaders[j].score + '</span>' 
            + '</li>';

        document.getElementById('leaderboard').innerHTML = str;
    },

    validateName: function(username) {
        // console.log(username);
        for(var j = 0; j < username.length; j++)
            if(username.charCodeAt(j) !== 0 && username.charCodeAt(j) !== 32)
                return username;


        return 'anon shooter';
    }
}

window.client = new Client();
