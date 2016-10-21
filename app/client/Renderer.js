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
	ctx.fillStyle = '#f2f2f2';
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