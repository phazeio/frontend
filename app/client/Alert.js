Renderer.prototype.drawAlert = function(h, a) {
	var cw = ctx.canvas.width;

	ctx.shadowColor = 'white';

	ctx.fillStyle = '#ff6699';
	ctx.roundRect(cw / 2 - 125, h, 250, 20, 5, true);

	ctx.shadowColor = 'black';
	ctx.shadowBlur = 15;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	ctx.strokeStyle = '#d9d9d9'
	ctx.roundRect(cw / 2 - 125, h, 250, 20, 5, false, true);

	ctx.fillStyle = 'white'
	ctx.font = 14 + "px Helvetica";
	ctx.textAlign = "center";
	ctx.fillText(a, cw / 2, h + 15); 
}

Renderer.prototype.drawAlerts = function() {
	for(var j = 0; j < client.alerts.length; j++)
			this.drawAlert(50 + (30 * j), client.alerts[j]);
}

function addAlert(a) {
	client.alerts.push(a);

	setTimeout(() => client.alerts.splice(client.alerts.indexOf(a), 1), 4000);
}

