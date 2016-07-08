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