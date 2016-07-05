function Crash() {

}

module.exports = Crash;

Crash.prototype.build = function() {
	var buf = new ArrayBuffer(1);
	var view = new DataView(buf);

	view.setUint8(0, 101);
	return buf;
}