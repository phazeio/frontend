function Stats(stats) {
	this.stats = stats;
}

module.exports = Stats;

Stats.prototype.build = function() {
	var buf = new ArrayBuffer(31 * this.stats.length + 1);
	var view = new DataView(buf);

	view.setUint8(0, 40);

	for(var j = 0; j < this.stats.length; j++) {
		var player = this.stats[j];

		for(var i = 0; i < 13; i++)
			view.setUint16((j * 31 + 1 + i * 2), player.username.charCodeAt(i));

		// j + length of one player in buffer + packetId length + username length
		view.setUint16(j * 31 + 1 + 26, player.score);
		view.setUint16(j * 31 + 1 + 28, player._id)
	}

	return buf;
}