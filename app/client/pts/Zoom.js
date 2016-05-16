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