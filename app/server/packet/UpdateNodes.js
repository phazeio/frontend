var DynamicBuffer = require('./DynamicBuffer');

function UpdateNodes(nodes) {
    this.nodes = nodes;
}

module.exports = UpdateNodes;

UpdateNodes.prototype.build = function() {
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
        view.setUint8(j * 43 + 10, node.color.r);
        view.setUint8(j * 43 + 11, node.color.g);
        view.setUint8(j * 43 + 12, node.color.b);
        view.setUint32(j * 43 + 13, node.updated);

        if(node.username)
            for(var i = j * 43 + 17; i < node.username.length; i++)
                view.setUint16(((i + 1) * 2), node.username.charCodeAt(i));
    }

    return buf;
}