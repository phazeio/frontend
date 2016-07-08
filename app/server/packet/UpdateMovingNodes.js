function UpdateMovingNodes(nodes) {
    this.nodes = nodes;
}

module.exports = UpdateMovingNodes;

UpdateMovingNodes.prototype.build = function() {
    var buf = new ArrayBuffer(43 * this.nodes.length);
    var view = new DataView(buf);

    view.setUint8(0, 20);

    for(var j = 0; j < this.nodes.length; j++) {
        var node = this.nodes[j];

        view.setUint16(j * 43 + 1, node._id);
        view.setUint16(j * 43 + 2, node.x);
        view.setUint16(j * 43 + 4, node.y);
        view.setUint16(j * 43 + 6, node.radius);
        view.setUint8(j * 43 + 8, node.health);
        view.setUint8(j * 43 + 9, node.damage ? 1 : 0);
    }

    return buf;
}