var m = 0;

function drawManaBar() {
	var ch = ctx.canvas.height
		, cw = ctx.canvas.width;

	var bar = Game.Player.score / Game.top * 200;

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

	ctx.shadowColor = 'black';
	ctx.shadowBlur = 15;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	ctx.strokeStyle = '#d9d9d9'
	ctx.roundRect(cw / 2 - 100, ch - 80, 200, 20, 5, false, true);

	ctx.fillStyle = 'white'
	ctx.font = 14 + "px Helvetica";
	ctx.textAlign = "center";
	ctx.fillText(Game.Player.score + ' Mana', cw / 2, ch - 65); 
}