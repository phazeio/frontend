function Alert(alert) {
	this.alert = alert;
}

module.exports = Alert;

Alert.prototype.build = function() {
	if(this.alert.length > 64 /2) throw new Error('Alert cannot be more than 64bits!');

	var buf = new ArrayBuffer(65);
	var view = new DataView(buf);

	view.setUint8(0, 100);

	for(var j = 0; j < this.alert.length; j++)
		view.setUint16(j * 2 + 1, this.alert.charCodeAt(j));

	return buf;
}