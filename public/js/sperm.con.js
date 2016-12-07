Renderer.prototype.drawAlert = function(h, a) {
	var cw = ctx.canvas.width;

	ctx.shadowColor = 'white';

	ctx.fillStyle = '#ff6699';
	ctx.roundRect(cw / 2 - 125, h, 250, 20, 5, true);

	ctx.shadowColor = 'black';
	ctx.shadowBlur = 15;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	ctx.strokeStyle = '#d9d9d9'
	ctx.roundRect(cw / 2 - 125, h, 250, 20, 5, false, true);

	ctx.fillStyle = 'white'
	ctx.font = 14 + "px Helvetica";
	ctx.textAlign = "center";
	ctx.fillText(a, cw / 2, h + 15); 
}

Renderer.prototype.drawAlerts = function() {
	for(var j = 0; j < client.alerts.length; j++)
			this.drawAlert(50 + (30 * j), client.alerts[j]);
}

function addAlert(a) {
	client.alerts.push(a);

	setTimeout(() => client.alerts.splice(client.alerts.indexOf(a), 1), 4000);
}


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
            console.log(x);
            // console.log('loading...')
            if(x === 'null') 
                return setTimeout(self.loadServer.bind(client), 3000);

            // setup game
            // x = x.split('"');
            // x = x[1];

            var nick = document.getElementById('nickname')
            nick.placeholder = 'Nickname';
            nick.disabled = false;

            var playBtn = document.getElementById('play_button');
            playBtn.disabled = false;
            playBtn.className = 'enabled';

            client.connect('ws://' + x);
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

        // this.inactive_interval = setInterval(this.destroyInactive.bind(this), this.inactive_check);

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

/* --- COOKIES -- */
/* sexy c: 	   -- */

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
}(function () {
	function extend () {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function init (converter) {
		function api (key, value, attributes) {
			var result;
			if (typeof document === 'undefined') {
				return;
			}

			// Write

			if (arguments.length > 1) {
				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				if (typeof attributes.expires === 'number') {
					var expires = new Date();
					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires);
					attributes.expires = expires;
				}

				try {
					result = JSON.stringify(value);
					if (/^[\{\[]/.test(result)) {
						value = result;
					}
				} catch (e) {}

				if (!converter.write) {
					value = encodeURIComponent(String(value))
						.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
				} else {
					value = converter.write(value, key);
				}

				key = encodeURIComponent(String(key));
				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
				key = key.replace(/[\(\)]/g, escape);

				return (document.cookie = [
					key, '=', value,
					attributes.expires ? '; expires=' + attributes.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
					attributes.path ? '; path=' + attributes.path : '',
					attributes.domain ? '; domain=' + attributes.domain : '',
					attributes.secure ? '; secure' : ''
				].join(''));
			}

			// Read

			if (!key) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var rdecode = /(%[0-9A-Z]{2})+/g;
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = parts[0].replace(rdecode, decodeURIComponent);
					cookie = converter.read ?
						converter.read(cookie, name) : converter(cookie, name) ||
						cookie.replace(rdecode, decodeURIComponent);

					if (this.json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					if (key === name) {
						result = cookie;
						break;
					}

					if (!key) {
						result[name] = cookie;
					}
				} catch (e) {}
			}

			return result;
		}

		api.set = api;
		api.get = function (key) {
			return api(key);
		};
		api.getJSON = function () {
			return api.apply({
				json: true
			}, [].slice.call(arguments));
		};
		api.defaults = {};

		api.remove = function (key, attributes) {
			api(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
}));
var music 	= new Audio('/audio/813.mp3')
	, click	= new Audio('/audio/click.ogg')
	, pop 	= new Audio('/audio/pop.mp3')
	, twitterAuth;

window.userLoggedIn = function(user) {
	document.getElementById('profile').style.display = 'block';
	document.getElementById('profile-picture').src = user.profile_image_url_https
	twitterAuth.close();

	// get user information
	
	Cookies.set('id', user.id);
}

window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};

window.onload = function() {
	/*	twitter */
	$('#login-twitter').on('click', function() {
    	twitterAuth = window.open("/request-token", "_blank", "scrollbars=1,resizable=1,height=300,width=450");
    });

	$('#overlay').fadeIn(1000);

	drawGrid();

	var nickname = $('#nickname');

	$('#game_form').submit(e => {
		e.preventDefault();
		if(nickname.val().length > 13) {
			alert('Nickname cannot be longer than 13 characters!');
			return;
		}

		click.play();
		client.ws.send((new Packet.Handshake(nickname.val())).build());

	})

	$('.enabled').click(function() {
		click.play();
	})

	window.addEventListener('keyup', function(e) {
		if(e.keyCode !== 32)
			return;

		client.ws.send((new Packet.Heal()).build());
	});

	// var play_btn = document.getElementById('play_btn')
	// 	, mute_btn = document.getElementById('mute_btn');

	// play_btn.addEventListener('mouseup', () => {
	// 	$(play_btn).hide();
	// 	$(mute_btn).show();
	// 	music.play()
	// });

	// mute_btn.addEventListener('mouseup', () => {
	// 	$(mute_btn).hide();
	// 	$(play_btn).show();
	// 	music.pause()
	// });
}

function drawGrid() {
	var gridCanvas = document.getElementById('grid')
		, grid = gridCanvas.getContext('2d');

	gridCanvas.width = window.innerWidth ;
	gridCanvas.height = window.innerHeight;

	grid.fillStyle = '#f2f2f2';
	grid.fillRect(0,0,window.innerWidth,window.innerHeight);

	grid.fillStyle = '#333333';
	grid.shadowColor = '#cccccc';
	grid.shadowBlur = 5;
	grid.shadowOffsetX = 0;
	grid.shadowOffsetY = 0;

	for(var j = 0; j < window.innerWidth; j+=50)
		grid.fillRect(j, 0, 0.3, window.innerHeight);

	for(var j = 0; j < window.innerHeight; j+=50)
		grid.fillRect(0, j, window.innerWidth, 0.3);
}

window.addEventListener('resize', function() {
	if(client.inGame)
		return;

	drawGrid();
})

connectingAnimation();

function startConnecting() {
	var nick = document.getElementById('nickname');
	nick.placeholder = 'Connecting.';
    nick.disabled = true;

    var playBtn = document.getElementById('play_button');
    playBtn.disabled = true;
    playBtn.className = 'disabled';

	setTimeout(client.loadServer.bind(client), 3000);
	connectingAnimation();	
}

function connectingAnimation() {
	var j = true;

	var conInt = setInterval(connecting, 500);

	function connecting() {
		var nick = document.getElementById('nickname');

		switch(nick.placeholder) {
			case 'Connecting.':
					j = true;
					nick.placeholder = 'Connecting..';
				break;
			case 'Connecting..':
				if(j)
					nick.placeholder = 'Connecting...';
				else
					nick.placeholder = 'Connecting.'
				break;
			case 'Connecting...':
				j = false;
				nick.placeholder = 'Connecting..';
				break;
			default:
				clearInterval(conInt);
				break;
		}
	}
}
var h = 100;

Renderer.prototype.drawHealthBar = function() {
	var ch = ctx.canvas.height
		, cw = ctx.canvas.width;

	if(client.health < h)
		h -= 1;

	ctx.shadowColor = 'white';

	ctx.fillStyle = '#d9d9d9';
	ctx.roundRect(cw / 2 - 125, ch - 50, 250, 20, 5, true);

	ctx.fillStyle = '#66ff66';
	ctx.roundRect(cw / 2 - 125, ch - 50, h * 2.5, 20, 5, true);

	ctx.shadowColor = '#595959';

	ctx.strokeStyle = '#d9d9d9'
	ctx.roundRect(cw / 2 - 125, ch - 50, 250, 20, 5, false, true);

	ctx.fillStyle = 'white'
	ctx.fillText(client.health + '/100 HP', cw / 2, ch - 35); 
}
var m = 0;

Renderer.prototype.drawManaBar = function() {
	var ch = ctx.canvas.height
		, cw = ctx.canvas.width;

	var bar = client.mana / 350 * 200;

	if(bar > 200)
		bar = 200;

	if(bar < m)
		m -= 1;
	else if(bar > m)
		m += 1;

	ctx.shadowColor = 'white';

	ctx.fillStyle = '#d9d9d9';
	ctx.roundRect(cw / 2 - 100, ch - 80, 200, 20, 5, true);

	ctx.fillStyle = '#99ccff';
	ctx.roundRect(cw / 2 - 100, ch - 80, m, 20, 5, true);

	ctx.shadowColor = '#595959';

	ctx.strokeStyle = '#d9d9d9'
	ctx.roundRect(cw / 2 - 100, ch - 80, 200, 20, 5, false, true);

	ctx.fillStyle = 'white'
	ctx.fillText(client.mana + '/350 Mana', cw / 2, ch - 65); 
}
var Packet = {
	// send the handshake packet
	Handshake: function(username) {
		this.username = username;

		this.build = function() {
			var buf = new ArrayBuffer(13 * 2 + 1)
				, view = new DataView(buf);

			// set packet id to 0
			view.setUint8(0, 0);

			// convert username to binary
			for(var j = 0; j < this.username.length; j++) {
				view.setUint16(((j + 1) * 2), this.username.charCodeAt(j));
			}

			return buf;
		}
	},

	// mouse event object
	MouseMove: function(mouse) {
		this.x = mouse.clientX - window.innerWidth / 2;
		this.y = mouse.clientY - window.innerHeight / 2 - 50;

		this.build = function() {
			var buf = new ArrayBuffer(5)
				, view = new DataView(buf);

			view.setUint8(0, 2);
			view.setFloat32(1, ((Math.atan2(this.y, this.x) + Math.PI * 2) % (Math.PI * 2)));

			return buf;
		}
	},


	// shoot event
	Shoot: function() {
		this.build = function() {
			var buf = new ArrayBuffer(1)
				, view = new DataView(buf);

			// set packet id to 3
			view.setUint8(0, 3);

			return buf;
		}
	},

	// heal event
	Heal: function() {
		this.build = function() {
			var buf = new ArrayBuffer(1)
				, view = new DataView(buf);

			// set packet id to 4
			view.setUint8(0, 4);

			return buf;
		}
	},

	// ranked match queue join
	JoinQueue: function(id) {
		this.build = function() {
			var buf = new ArrayBuffer()
				, view = new DataView(buf);

			// set packet id to 5
			view.setUint8(0, 5);
			view.setUint32(1, id);

			return buf;
		}
	}
}
function Renderer() {
	this.canvas = document.createElement('canvas');
	this.renderInterval;
	this.zoom = {
		height: document.documentElement.clientWidth / window.outerWidth,
		width: document.documentElement.clientHeight / window.outerHeight
	}

	// so anything can access the context
	window.ctx = this.canvas.getContext('2d');
	ctx.lineWidth = 5;

	ctx.canvas.width = this.width = window.innerWidth;
	ctx.canvas.height = this.height = window.innerHeight;

	document.body.appendChild(ctx.canvas);

	this.start = function() {
		$('.wrapper').show();
		$('#overlay').fadeOut('slow');

		this.renderInterval = setInterval(this.mainLoop.bind(this), 1000 / 60);
		// this.garbageInterval = setInterval(this.garbageLoop.bind(this), 1000 / 30);

		window.addEventListener('resize', this.resize.bind(this));

		this.canvas.addEventListener('mousemove', function(e) {
		client.ws.send((new Packet.MouseMove(e)).build());
	})

		this.canvas.addEventListener('mousedown', (e) => {
			// cancel text selection
			e.preventDefault();

			switch(e.which) {
				case 1:
					client.ws.send((new Packet.Shoot()).build());
					break;
				case 3:
					client.ws.send((new Packet.Heal()).build());
					break
				default:
					// idk
					break;
			}
		});
	}

	this.stop = function() {
		$('.wrapper').hide();
		$('#overlay').fadeIn('slow');

		clearInterval(this.renderInterval);
		window.removeEventListener('resize', this.resize);
	}
}

Renderer.prototype.getZoom = () => document.documentElement.clientWidth / window.outerWidth;

Renderer.prototype.drawEntity = function(e) {
	// console.log(e.x);
	// console.log(e.y);
	// console.log(e.radius);

	var crds = this.crds2ctx(e);

	if(e.damage)
		ctx.fillStyle = '#cc0000'
	else if(e.healing)
		ctx.fillStyle = '#fc20e6'
	else
		ctx.fillStyle = 'rgba(' + e.color.r + ', ' + (e.color.g + 30 > 255 ? 255 : e.color.g + 30) + ', ' + (e.color.b + 30 > 255 ? 255 : e.color.b + 30) + ', ' + 0.4 + ')';

	ctx.beginPath();
	ctx.arc(crds.x, crds.y, e.radius + 10 + (Math.random() * 1), 0, 2 * Math.PI);
	ctx.closePath();
	ctx.fill();

	if(e.damage)
		ctx.fillStyle = '#ff3333';
	else if(e.healing)
		ctx.fillStyle = '#fd7ff0';
	else
		ctx.fillStyle = 'rgb(' + e.color.r + ', ' + e.color.g + ', ' + e.color.b + ');';

	ctx.beginPath();
	ctx.arc(crds.x, crds.y, e.radius + (Math.random() * 1), 0, 2 * Math.PI);
	ctx.closePath();
	ctx.fill();

	if(!e.health)
		return;

	ctx.fillStyle = 'white'
	ctx.fillText(e.health + '%', crds.x, crds.y + 3); 
}

Renderer.prototype.drawLines = function() {
	var zoom = 1 + (1 - document.documentElement.clientWidth / window.outerWidth);

	// check zoom
	ctx.fillStyle = '#222';
	ctx.fillRect(0,0,window.outerWidth,window.outerHeight);

	ctx.fillStyle = '#333333';
	ctx.shadowColor = '#cccccc';
	ctx.shadowBlur = 5;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	var start =  ~~((client.x - 1000) / 100) * 100
		, stop = start + 2 * 1000;


	for (var j = start; j < stop; j+=100) {
		ctx.fillStyle = (j === 0 || j === 10000) ? 'red' : '#333333';
		var x = window.innerWidth / 2 - (client.x - j);
		ctx.fillRect(x, 0, 0.3, window.innerHeight * zoom);
	}

	start = ~~((client.y - 1000) / 100) * 100
		, stop = start + 2 * 1000;

	for (var j = start; j < stop; j+=100) {
		ctx.fillStyle = (j === 0 || j === 10000) ? 'red' : '#333333';
		var y = window.innerHeight / 2 - (client.y - j);
		ctx.fillRect(0, y, window.innerWidth * zoom, 0.3);
	}
}

Renderer.prototype.updateCoords = function() {
	$('#player_x').text(~~client.x);
	$('#player_y').text(~~client.y);
}

Renderer.prototype.mainLoop = function() {
	this.drawLines();

	
	ctx.font = 12 + "px minecraft";
	ctx.textAlign = "center";

	for(var j = 0; j < client.entities.length; j++)
		this.drawEntity(client.entities[j]);

	ctx.lineWidth = 5;
	ctx.shadowBlur = 15;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.shadowColor = '#595959';
	
	this.drawEntity(client);
	this.updateCoords();
	this.drawManaBar();
	this.drawHealthBar();
	this.drawAlerts();
}

Renderer.prototype.garbageLoop = function() {
	for(var j = 0; j < client.entities.length; j++)
		if(Date.now() - client.entities[j].updated > 200)
			continue;

	console.log('garbage!');

	client.entities.splice(j, 1);
	j--;
}

Renderer.prototype.crds2ctx = function(o) {
	var x = client.x - o.x
		, y = client.y - o.y;

	return {x: window.outerWidth / 2 - x, y: window.outerHeight / 2 - y};
}

Renderer.prototype.updateZoom = function() {
	this.zoom.height = document.documentElement.clientWidth / window.outerWidth;
	this.zoom.width = document.documentElement.clientHeight / window.outerHeight
}

Renderer.prototype.resize = function() {
	this.updateZoom();

	ctx.canvas.height = window.innerHeight;
	ctx.canvas.width = window.innerWidth;


	var zoom = document.documentElement.clientWidth / window.outerWidth;

	console.log(zoom)
	ctx.scale(zoom, zoom);
}
CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius, fill, stroke) {
	if(typeof stroke == "undefined" ) {
		stroke = true;
	}

	if(typeof radius === "undefined") {
		radius = 5;
	}

	this.beginPath();
	this.moveTo(x + radius, y);
	this.lineTo(x + width - radius, y);
	this.quadraticCurveTo(x + width, y, x + width, y + radius);
	this.lineTo(x + width, y + height - radius);
	this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	this.lineTo(x + radius, y + height);
	this.quadraticCurveTo(x, y + height, x, y + height - radius);
	this.lineTo(x, y + radius);
	this.quadraticCurveTo(x, y, x + radius, y);
	this.closePath();
	
	if (stroke) {
		this.stroke();
	}

	if (fill) {
		this.fill();
	}        
}