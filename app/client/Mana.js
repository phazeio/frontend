var m = 0;

Renderer.prototype.drawManaBar = function() {
	var ch = ctx.canvas.height
		, cw = ctx.canvas.width;

	var bar = client.mana / 350 * 200;

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

	ctx.shadowColor = '#595959';

	ctx.strokeStyle = '#d9d9d9'
	ctx.roundRect(cw / 2 - 100, ch - 80, 200, 20, 5, false, true);

	ctx.fillStyle = 'white'
	ctx.fillText(client.mana + '/350 Mana', cw / 2, ch - 65); 
}