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

		ctx.fillStyle = '#333333';
		ctx.shadowColor = '#cccccc';
		ctx.shadowBlur = 5;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;

		var start =  ~~((Game.Player.x - Constants.VIEW_DISTANCE) / 100) * 100
			, stop = start + 2 * Constants.VIEW_DISTANCE;

		for (var j = start; j < stop; j+=100) {
			ctx.fillStyle = (j === 0 || j === Game.Map.width) ? 'red' : '#333333';
			var x = Game.View.width / 2 - (Game.Player.x - j);
			ctx.fillRect(x, 0, 3, window.innerHeight);
		}

		start = ~~((Game.Player.y - Constants.VIEW_DISTANCE) / 100) * 100
			, stop = start + 2 * Constants.VIEW_DISTANCE;

		for (var j = start; j < stop; j+=100) {
			ctx.fillStyle = (j === 0 || j === Game.Map.height) ? 'red' : '#333333';
			var y = Game.View.height / 2 - (Game.Player.y - j);
			ctx.fillRect(0, y, window.innerWidth, 3);
		}

		drawAllFood();
		drawAllPlayers();

		Game.Player.draw(this.width / 2, this.height / 2);
	}
}