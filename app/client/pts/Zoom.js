function Zoom() {
	this.baseWidth = window.outerWidth;
	this.relWidth = document.documentElement.clientWidth;

	this.getZoom = () => {
		console.log(this.relWidth / this.baseWidth);
		console.log(this.relWidth / this.baseWidth - Game.Player.getScoreDecrease());
		return (this.relWidth / this.baseWidth)
	};

	this.updateZoom = () => {
		this.baseWidth = window.outerWidth;
		this.relWidth = document.documentElement.clientWidth;
	}

	this.scale = () => {
		ctx.scale(Game.Zoom.getZoom(), Game.Zoom.getZoom());
	}
}