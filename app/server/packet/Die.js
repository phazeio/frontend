function Die() {

}

module.exports = Die;

Die.prototype.build = function() {
	var buf = new ArrayBuffer(1);
	var view = new DataView(buf);

	view.setUint8(0, 90);
	
	return buf;
}