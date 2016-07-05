function Damage() {
	// erm
}

module.exports = Damage;

Damage.prototype.build = function() {
	var buf = new ArrayBuffer(1);
	var view = new DataView(buf);

	view.setUint8(0, 16, true);

	return buf;
}