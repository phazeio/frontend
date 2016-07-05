function Test() {

}

module.exports = Test;

Test.prototype.build = function() {
	var buf = new ArrayBuffer(3);
	var view = new DataView(buf);

	view.setUint8(0, 30);

	view.setUint16(1, 12991);

	return buf;
}