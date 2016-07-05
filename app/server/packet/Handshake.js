function Handshake(player) {
	this.color = player.color;
	this.x = player.x;
	this.y = player.y;
	this._id = player._id;
	this.radius = player.radius;
	this.health = player.health;
	this.mana = player.mana;
}

module.exports = Handshake;

Handshake.prototype.build = function() {
	var buf = new ArrayBuffer(15);
	var view = new DataView(buf);

	view.setUint8(0, 1); // packetId
	view.setUint16(1, this._id); // _id
	view.setUint16(3, this.x) // x
	view.setUint16(5, this.y); // y
	view.setUint16(7, this.radius); // radius
	view.setUint16(9, this.mana); // mana
	view.setUint8(11, this.health);
	view.setUint8(12, this.color.r); // r
	view.setUint8(13, this.color.g); // g
	view.setUint8(14, this.color.b); // b

	return buf;
}