// global variables

var Game = {}
	, SPEED = 5
	, MAP_SIZE = 4000
	, FOOD_RADIUS = 6
	, LINE_WIDTH = 5
	, PLAYER_RADIUS = 25
	, SNAKINESS = 10
	, CTX = null
	, theta = 0
	, mouse = {
		x: 0,
		y: 0
	}
	, PLAYER = new Player();

// intervals
var drawInterval
	, spawnFoodInterval;

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
	music.play();

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

	Game.Map = new Map(data.map.getX(), data.map.getY());
	Game.View = new View();
	Game.Player = new Player(data.player.getUsername(), 
		data.player.getX(), 
		data.player.getY(), 
		data.player.getColor());
	Game.Zoom = new Zoom();
	Game.food = [];

	// Game.getSNAKINESS = () => SNAKINESS * this.Zoom.getZoom();
	// Game.getLINE_WIDTH = () => LINE_WIDTH * this.Zoom.getZoom();

	Game.View.resize();

	document.body.onmousemove = function(e) {
		mouse.x = e.clientX;
		mouse.y = e.clientY;
	}

	document.addEventListener('keydown', e => {
		if(e.keyCode !== 32)
			return;

		Game.Player.speed = SPEED * 2;
		Game.Player.nitrus = true;
	})

	document.addEventListener('keyup', e => {
		if(e.keyCode !== 32)
			return;

		Game.Player.speed = SPEED;
		Game.Player.nitrus = false;
	})

	window.onresize = e => {
		Game.Zoom.updateZoom();
		Game.View.resize();
	}

	setInterval(() => {
		Game.Player.update();
		Game.Player.move();
		document.getElementById('score').innerHTML = Game.Player.score;
	}, 1000 / 60)

	drawInterval = setInterval(() => {
		Game.View.draw();
	}, 1000 / 120)

	spawnFoodInterval = setInterval(() => {
		Game.food.push(new Food());
	}, 1000)
}

function stopGame() {
	music.pause();
	
	clearInterval(drawInterval);
	clearInterval(spawnFoodInterval);

	// reset Game object
	Game = {};

	$('.wrapper').hide();
	$('#overlay').fadeIn('slow');
}