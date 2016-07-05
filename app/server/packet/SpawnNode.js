function SpawnNode(node) {
	this.node = node;
}

module.exports = SpawnNode;

SpawnNode.prototype.build = function() {
	if(this.node.entityType === 2)
		return serializePlayer(this.node);
	else
		return serializeNonPlayer(this.node);
}

function serializePlayer(node) {
	var buf = new ArrayBuffer(14);
	var view = new DataView(buf);

	view.setUint8(0, 21); // packetId
	view.setUint16(1, node._id); // nodeId
    view.setUint16(3, node.x); // x
    view.setUint16(5, node.y); // y
    view.setUint8(7, node.radius); // radius
    view.setUint8(8, node.health); // health
    view.setUint8(9, node.damage ? 1 : 0); // damage
    view.setUint8(10, node.healing ? 1 : 0);
    view.setUint8(11, node.color.r); // color red
    view.setUint8(12, node.color.g); // color green
    view.setUint8(13, node.color.b); // color blue

    return buf;
}

function serializeNonPlayer(node) {
	var buf = new ArrayBuffer(11);
	var view = new DataView(buf);

	view.setUint8(0, 22); // packetId
	view.setUint16(1, node._id); // nodeId
    view.setUint16(3, node.x); // x
    view.setUint16(5, node.y); // y
    view.setUint8(7, node.radius); // radius
    view.setUint8(8, node.color.r); // color red
    view.setUint8(9, node.color.g); // color green
    view.setUint8(10, node.color.b); // color blue

    return buf;
}