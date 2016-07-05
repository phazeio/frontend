function UpdateNode(node) {
	this.node = node;
}

module.exports = UpdateNode;

UpdateNode.prototype.build = function() {
	if(this.node.entityType === 2)
		return serializePlayer(this.node);
	else
		return serializeNonPlayer(this.node);
}

function serializePlayer(node) {
	var buf = new ArrayBuffer(11);
	var view = new DataView(buf);

	view.setUint8(0, 23); // packetId
	view.setUint16(1, node._id); // nodeId
    view.setUint16(3, node.x); // x
    view.setUint16(5, node.y); // y
    view.setUint8(7, node.radius); // radius
    view.setUint8(8, node.health); // health
    view.setUint8(9, node.damage ? 1 : 0); // damage
    view.setUint8(10, node.healing ? 1 : 0); // damage

    return buf;
}

function serializeNonPlayer(node) {
	var buf = new ArrayBuffer(7);
	var view = new DataView(buf);

	view.setUint8(0, 24); // packetId
	view.setUint16(1, node._id); // nodeId
    view.setUint16(3, node.x); // x
    view.setUint16(5, node.y); // y

    return buf;
}