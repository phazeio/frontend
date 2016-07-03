// global variables
var Game = {}
	, theta = 0
	, mouse = {
		x: 0,
		y: 0
	};

// intervals
var drawInterval
	, spawnFoodInterval
	, garbageInterval
	, updateInterval;

connectToSocketServer();

/**
* Map Class
*
*/
function Map(w, h) {
	this.width = w;
	this.height = h;
	this.bkg = document.getElementById('source');
}

function sendHandshake(username) {
	// music.play();

	$('.wrapper').show();

	$('#overlay').fadeOut(1000);

	/*
	*
	* SEND PACKET TO SERVER
	*
	* COMPLETE HANDSHAKE + BUILD CLIENT SIDE FROM SERVER DATA
	*
	*/
	ws.send(JSON.stringify({id: 'handshake', username: username}))
}

function startGame(data) {
	console.log('ok')

	Game.Map = new Map(data.map.width, data.map.height);
	Game.View = new View();
	Game.Player = new Player(data.player.username, 
		data.player.x, 
		data.player.y, 
		data.player._id,
		data.player.color);
	Game.Zoom = new Zoom();
	Game.food = [];
	Game.shards = [];
	Game.players = [];
	Game.Leaderboard = [];
	Game.Alerts = [];
	Game.top = 1;

	// Game.getSNAKINESS = () => SNAKINESS * this.Zoom.getZoom();
	// Game.getLINE_WIDTH = () => LINE_WIDTH * this.Zoom.getZoom();

	Game.View.resize();

	document.body.onmousemove = function(e) {
		mouse.x = e.clientX;
		mouse.y = e.clientY;
	}

	document.addEventListener('keyup', e => {
		if(e.keyCode !== 32)
			return;

		// shoot shard
		SpermEvent.emit('player_shoot_event', {p: Game.Player});
		
	})

	window.onresize = e => {
		Game.Zoom.updateZoom();
		Game.View.resize();
	}

	updateInterval = setInterval(() => {
		Game.Player.update();

		// document.getElementById('score').innerHTML = Game.Player.score;

		$('#player_x').text(~~Game.Player.x);
		$('#player_y').text(~~Game.Player.y);

	}, 1000 / 60)

	drawInterval = setInterval(() => {
		Game.View.draw();
	}, 1000 / 60)

	// garbage collection
	garbageInterval = setInterval(() => {
		var v = getView();

		for(var j = 0; j < Game.food.length; j++) {
			if(!v.isInView(Game.food[j])) {
				Game.food.splice(j, 1);
				j--;
			}
		}

		for(var j = 0; j < Game.players.length; j++) {
			if(!v.isInView(Game.players[j])) {
				Game.players.splice(j, 1);
				j--;
				continue;
			}

			if(Date.now() - Game.players[j].updated > 50) {
				Game.players.splice(j, 1);
				j--;
			}
		}

		for(var j = 0; j < Game.shards.length; j++) {
			if(!v.isInView(Game.shards[j])) {
				Game.shards.splice(j, 1);
				j--;
				continue;
			}

			if(Date.now() - Game.shards[j].updated > 50) {
				Game.shards.splice(j, 1);
				j--;
			}
		}
	})
}

function stopGame() {
	music.pause();
	
	clearInterval(drawInterval);
	clearInterval(updateInterval);
	clearInterval(garbageInterval);
	clearInterval(spawnFoodInterval);

	ctx.canvas.remove();

	// reset Game object
	Game = {};

	$('.wrapper').hide();
	$('#overlay').fadeIn('slow');

	connectToSocketServer();
}