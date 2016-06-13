function Zoom() {
	this.baseWidth = window.outerWidth;
	this.relWidth = document.documentElement.clientWidth;

	this.getZoom = () => {
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