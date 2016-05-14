/**
* View Class
*/
function View() {
	this.canvas = document.createElement('canvas');

	// so anything can access the context
	window.ctx = this.canvas.getContext('2d');

	this.canvas.width = this.width = window.innerWidth;
	this.canvas.height = this.height = window.innerHeight;

	document.body.appendChild(this.canvas);

	this.resize = () => {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	// only follow if players goes past 5px from the center in a direction
	this.follow = () => {
		var image = document.getElementById('source');
		// this.ctx.drawImage(image, 0, 0, 0 + (Game.Player.x - this.canvas.width), 0 + Game.Player.y, this.canvas.width, this.canvas.height);
	}

	this.draw = () => {
		ctx.fillStyle = '#ff99cc';
		ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

		var image = document.getElementById('source');
		ctx.drawImage(image, Game.Player.x, Game.Player.y, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);

		drawAllFood();

		Game.Player.draw(this.width / 2, this.height / 2);
	}
}