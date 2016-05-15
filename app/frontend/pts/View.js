/**
* View Class
*/
function View() {
	var image = document.getElementById('source');
	this.canvas = document.createElement('canvas');

	// so anything can access the context
	window.ctx = this.canvas.getContext('2d');

	this.canvas.width = this.width = window.innerWidth;
	this.canvas.height = this.height = window.innerHeight;

	document.body.appendChild(this.canvas);

	this.resize = () => {
		this.canvas.width = this.width = window.innerWidth;
		this.canvas.height = this.height = window.innerHeight;
	}

	this.draw = () => {
		ctx.fillStyle = '#ff99cc';
		ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

		ctx.drawImage(image, Game.Player.x - this.width / 2, Game.Player.y - this.height / 2, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);

		drawAllFood();

		Game.Player.draw(this.width / 2, this.height / 2);
	}
}