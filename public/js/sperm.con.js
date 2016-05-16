/*
* @param o - an Entity object
*
* @return object - x and y canvas coordinates
*/
function crds2ctx(o) {
	var x = Game.Player.x - o.x
		, y = Game.Player.y - o.y;

	return {x: Game.View.width / 2 - x, y: Game.View.height / 2 - y};
}

/*
* @param start -
* @param end - 
*
* @return object - 
*/	
function angleBetween(start, end) {
	var opp = end.y - start.y,
			adj = end.x - start.x;
	return Math.atan(opp/adj) + (end.x <= start.x ? Math.PI : 0); //theta depends on quadrant
}

function sineCircleXYatAngle(cx, cy, radius, amplitude, angle, sineCount){
	var x = cx + (radius + amplitude * Math.sin(sineCount * angle)) * Math.cos(angle),
		y = cy + (radius + amplitude * Math.sin(sineCount * angle)) * Math.sin(angle);
  	return({x:x,y:y});
}

function spawnFood() {
	Game.food.push(new Food());
}

/*
* @param o1 - an Entity object
* @param o2 - an Entity object
*
* returns double - distance between two entities
*/
function getDistance(o1, o2) {
	return Math.sqrt(Math.pow((o1.x - o2.x), 2) + Math.pow((o1.y - o2.y), 2)) - (o2.radius + o1.radius);
}

/*
* @param o1 - an Entity object
* @param o2 - an Entity object
* @param skew - an int Skew the distance
*
* @returns boolean - if entities are overlapping
*/
function areOverlapping(o1, o2, skew) {
	return getDistance(o1, o2) < (0 - (skew || 0 ));
}

/*
* Generates random hex color
*/
function randomColor() {
	return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

/* 
* @param h - a hex value
* translates hex into rgb
*
* @return rgb value
*/
function h2r(h) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/*
* Draws all food entities on the map
*/
function drawAllFood() {
	for (var i = 0; i < Game.food.length; i++) {
		Game.food[i].fadeIn(0.3);
		Game.food[i].checkForce(Game.Player);
		Game.food[i].draw();
		if (Game.food[i].isEaten()) {
			Game.food[i].color = Game.Player.color;
			Game.food[i].radius = FOOD_RADIUS * 0.2;
			Game.food[i].chained = true;

			if(Game.Player.score === 0 || Game.Player.score % 5 === 0)
				Game.Player.food.push(Game.food[i]);

			SpermEvent.emit('player_eat_event', {player: Game.Player, food: Game.Food});
			Game.Zoom.scale();
			Game.Player.score++;
			Game.food.splice(i, 1);
			i--;
		}
	}

	if (Game.Player.food[0]) {
		Game.Player.food[0].followLeader(Game.Player);
		Game.Player.food[0].fadeIn(0.1);
		Game.Player.food[0].draw();
		for (var j = 1; j < Game.Player.food.length; j++) {
			Game.Player.food[j].followLeader(Game.Player.food[j - 1]);
			Game.Player.food[j].fadeIn(0.1);
			Game.Player.food[j].draw();	
		}
	}
}

try {
	module.exports.angleBetween = angleBetween;
	module.exports.sineCircleXYatAngle = sineCircleXYatAngle;
	module.exports.getDistance = getDistance;
	module.exports.areOverlapping = areOverlapping;
	module.exports.randomColor = randomColor;
	module.exports.h2r = h2r;
} catch(e) {
	console.log('Running in browser');
}

/**
* Entity Class
*/
function Entity(x, y, radius, _id) {
	this.x 		= x;
	this.y 		= y;
	this.color 	= randomColor();
	this.radius = radius;
	this._id  	= null;

	// set id
	this.set_id = (_id) => this._id = _id;

	this.setX = x => this.x = x;
	this.setY = y => this.y = y;
	this.setColor = c => this.color = c;
	this.setRadius = r => this.radius = r;

	this.getX = () => this.x;
	this.getY = () => this.y;
	this.getColor = () => this.color;
	this.getRadius = () => this.radius;
}

var doge = document.createElement('img');
doge.src = 'https://cdn.thinglink.me/api/image/727110550026190849/1240/10/scaletowidth';

/**
* Player Class
*/
function Player(username) {
	Entity.call(this, ~~((Math.random() * 300) + MAP_SIZE / 3), ~~((Math.random() * 300) + MAP_SIZE / 3), PLAYER_RADIUS);
	this.food = [];
	this.score = 0;
	this.nitrus = false;
	this.username = username;
	this.speed = SPEED;

	this.getScoreDecrease = () => 0.004 * this.score;

	/*
	* move player
	*/
	this.move = () => {
		// if(this.y + SPEED * Math.sin(theta) > 0 && this.y + SPEED * Math.sin(theta) < Game.Map.height)
			this.y += this.speed * Math.sin(theta);
		// if(this.x + SPEED * Math.sin(theta) > 0 && this.x + SPEED * Math.sin(theta) < Game.Map.width)
			this.x += this.speed * Math.cos(theta);

			// EMIT MOVE EVENT
			SpermEvent.emit('player_move_event', {player: this});
	}

	/* 
	* update angle
	*/
	this.update = () => {
		var n = angleBetween({x: window.innerWidth / 2, y: window.innerHeight / 2}, mouse);

		theta = n;
		// Smoother Movement
		// if(n < theta) 
		// 	theta = theta - (theta - n) / 10;
		// else
		// 	theta = theta + (n - theta) / 10;

		this.radius = PLAYER_RADIUS + (0.5 * this.score);
	}

	this.draw = (x, y) => {
		var amp = 1.2,
			sineCount = Math.floor(Math.random() * 5) + 3,
			start = Math.floor(Math.random() * 100),
			stop = start + 360;

		ctx.beginPath();

		for (var i = start; i < stop; i++) {
			var angle = i * Math.PI / 180,
		  		pt = sineCircleXYatAngle(x, y, this.radius, amp, angle, sineCount);
		  	ctx.lineTo(pt.x, pt.y);
		}

		doge.width = this.radius + 5;
		doge.height = this.radius + 5;

		// ctx.fillStyle = ctx.createPattern(doge, 'repeat');

		if(this.nitrus === true) {
			ctx.shadowColor = '#ff5050'
			ctx.shadowBlur = 30;
		} else {
			ctx.shadowColor = '#595959';
			ctx.shadowBlur = 20;
		}

		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.lineWidth = LINE_WIDTH;
		ctx.strokeStyle = 'rgb(r: ' + h2r(this.color).r + ', g: ' + (h2r(this.color).g) + ', b: ' + (h2r(this.color).b + 15) + ')';
		ctx.closePath();
		ctx.stroke();

		// because double tildas are fucking cool
		ctx.font = (~~20) + "px Helvetica";

		ctx.shadowColor = this.color;
		ctx.shadowBlur = 10;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.fillText(this.username, window.outerWidth/2, window.outerHeight/2 + this.radius + 20); 

		// reset shadow color
		ctx.shadowColor = 'rgba(0,0,0,0)';
	}
}

/**
* Food Class
*
*/
function Food() {
	Entity.call(this, Math.random() * Game.Map.width, Math.random() * Game.Map.height, FOOD_RADIUS);

	this.color = randomColor();
	this.radius = FOOD_RADIUS * 0.2;
	this.chained = false;

	this.draw = function() {
		var r = h2r(this.color);

		if(r == null)
			return;

		var crds = crds2ctx(this);

		if(this.chained)
			if(Game.Player.nitrus === true) {
				ctx.shadowColor = '#ff5050'
				ctx.shadowBlur = 30;
				ctx.shadowBlur = 10;
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;
			}

		ctx.fillStyle = 'rgba(' + r.r + ', ' + (r.g + 30) + ', ' + (r.b + 30) + ', ' + 0.4 + ')';
		ctx.beginPath();
		ctx.arc(crds.x, crds.y, this.radius + 4 + (Math.random() * 1), 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(crds.x, crds.y, this.radius + (Math.random() * 1), 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}





	this.isEaten = function() {
		return areOverlapping(this, Game.Player, 2);
	}

	/*
	* check the distance between food and player
	* if size / force of player object is strong enough, start moving food towards the object
	* make the food smaller as it moves towards the player 
	* do the fancy stuff w/ the sinusoid at the right position to make the collision look pretty
	*/
	this.checkForce = function(o) {
		var dist = getDistance(o, this);
		var distThreshold = 20;
		var padding = 2;
		var attractionStrength = distThreshold - dist + padding;

		if (dist < distThreshold) {
			var angle = angleBetween(this, o);
			this.y += attractionStrength * Math.sin(angle);
			this.x += attractionStrength * Math.cos(angle);
			this.radius = (this.radius - 0.25 * attractionStrength) < 0 ? 0.1 : (this.radius - 0.25 * attractionStrength);
		}

	}

	/* 
	*follow leader when chained
	*/
	this.followLeader = function(o) {
		var dist = getDistance(o, this);
		var distThreshold = 20;
		var attractionStrength = distThreshold - dist - SNAKINESS;

		var angle = angleBetween(this, o);
			this.y -= attractionStrength * Math.sin(angle);
			this.x -= attractionStrength * Math.cos(angle);
	}

	/*
	*slowly increase food radius
	*/
	this.fadeIn = function (rate) {
		if(this.chained)
			this.radius = this.radius < FOOD_RADIUS + (Game.Player.score * 0.2) ? this.radius + rate : FOOD_RADIUS + (Game.Player.score * 0.2);
		else
			this.radius = this.radius < FOOD_RADIUS ? this.radius + rate : FOOD_RADIUS;
	}

}
function EventEmitter() {
	this.listeners = {};

	this.on = (eventName, callback) => {
		if (this.listeners[eventName])
			this.listeners[eventName].push(callback);
		else
			this.listeners[eventName] = [callback];
	}

	this.emit = (eventName, data) => {
		if (this.listeners[eventName])
			this.listeners[eventName].forEach(h => h(data));
	}
}

var SpermEvent = new EventEmitter();

/*
* [0] player_move_event - player moved
* [1] player_eat_event - player eats food
* [2] player_death_event - player died
* [3] idk
*
*/

SpermEvent.on('player_eat_event', e => {
	pop.play();
})

SpermEvent.on('player_move_event', e => {
	$('#player_x').text(~~e.player.x);
	$('#player_y').text(~~e.player.y);
})
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

function startGame(username) {
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
	ws.send(JSON.stringify({name: 'handshake', username: username}))

	Game.Map = new Map(4000, 4000);
	Game.View = new View();
	Game.Player = new Player(username);
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
var ws = new WebSocket('ws://localhost:3000', 'echo-protocol');

ws.onmessage = (o) => {
	try {
		var msg = JSON.parse(o);
		messages[o.name](o);
	} catch(e) {
		console.log('cannot parse the json :o')
	}
}

var messages = {
	game: function(g) {
		Game.food = g.food;
		Game.players = g.players;
	}
}

SpermEvent.on('player_move_event', e => {
	ws.send(JSON.stringify({id:'move', player: e.player}));
})

SpermEvent.on('player_eat_event', e => {
	ws.send(JSON.stringify({id: 'eat', player: e.player, food: e.food}));
})
/**
* View Class
*/
function View() {
	var image = document.getElementById('source');
	var canvas = document.createElement('canvas');

	// so anything can access the context
	window.ctx = canvas.getContext('2d');

	ctx.canvas.width = this.width = window.innerWidth;
	ctx.canvas.height = this.height = window.innerHeight;

	document.body.appendChild(ctx.canvas);

	// make a temporary canvas to try and mitigate the flicer when redrawing the canvas scaled-
	this.tempCanvas = ctx.canvas.cloneNode(true);
	this.tempCanvas.style['position'] = 'absolute';
	this.tempCanvas.style['top'] = 0;
	this.tempCanvas.style['left'] = 0;
	this.tempCanvas.style['z-index'] = -1;
	this.tempCanvas.width = window.innerWidth;
	this.tempCanvas.height = window.innerHeight;

	this.tempContext = this.tempCanvas.getContext('2d');

	document.body.appendChild(this.tempCanvas);

	this.resize = () => {
		// reverse the zoom of the temp image
		var tempZoom = Game.Zoom.getZoom() > 1 ? 1 - (Game.Zoom.getZoom() - 1) : 1 + (1 - Game.Zoom.getZoom());
		this.tempContext.scale(tempZoom, tempZoom);
		this.tempContext.drawImage(ctx.canvas, 0, 0);

		this.tempCanvas.width = window.innerWidth;
		this.tempCanvas.height = window.innerHeight;


		this.width = window.outerWidth;
		this.height = window.outerHeight;

		ctx.canvas.width = window.innerWidth;
		ctx.canvas.height = window.innerHeight;

		Game.Zoom.scale();

		setTimeout(() => {
			this.tempCanvas.width = window.innerWidth;
			this.tempCanvas.height = window.innerHeight;
		}, 200);

		// this.tempContext.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
	}

	this.draw = () => {
		ctx.fillStyle = '#ff99cc';
		ctx.fillRect(0,0,window.outerWidth,window.outerHeight);

		ctx.drawImage(image, Game.Player.x - this.width / 2, Game.Player.y - this.height / 2, window.outerWidth, window.outerHeight, 0, 0, window.outerWidth, window.outerHeight);

		drawAllFood();

		Game.Player.draw(this.width / 2, this.height / 2);
	}
}
function Zoom() {
	this.baseWidth = window.outerWidth;
	this.relWidth = document.documentElement.clientWidth;

	this.getZoom = () => (this.relWidth / this.baseWidth);
	//  - Game.Player.getScoreDecrease()

	this.updateZoom = () => {
		this.baseWidth = window.outerWidth;
		this.relWidth = document.documentElement.clientWidth;
	}

	this.scale = () => {
		ctx.scale(Game.Zoom.getZoom(), Game.Zoom.getZoom());
	}
}