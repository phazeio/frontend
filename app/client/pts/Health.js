var h = 100;

function drawHealthBar() {
	var ch = ctx.canvas.height
		, cw = ctx.canvas.width;

	if(Game.Player.health < h)
		h -= 1;

	ctx.shadowColor = 'white';

	ctx.fillStyle = '#d9d9d9';
	ctx.roundRect(cw / 2 - 125, ch - 50, 250, 20, 5, true);

	ctx.fillStyle = '#66ff66';
	ctx.roundRect(cw / 2 - 125, ch - 50, h * 2.5, 20, 5, true);

	ctx.shadowColor = 'black';
	ctx.shadowBlur = 15;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	ctx.strokeStyle = '#d9d9d9'
	ctx.roundRect(cw / 2 - 125, ch - 50, 250, 20, 5, false, true);

	ctx.fillStyle = 'white'
	ctx.font = 14 + "px Helvetica";
	ctx.textAlign = "center";
	ctx.fillText(Game.Player.health + '/100 HP', cw / 2, ch - 35); 
}