function UpdatePosition(player) {
    this.x = player.x;
    this.y = player.y;
    this.radius = player.radius;
    this.mana = player.mana;
    this.health = player.health;
    this.damage = player.damage;
    this.healing = player.healing;
}

module.exports = UpdatePosition;

UpdatePosition.prototype.build = function() {
    var buf = new ArrayBuffer(12);
    var view = new DataView(buf);

    view.setUint8(0, 14);
    view.setUint16(1, this.x);
    view.setUint16(3, this.y);
    view.setUint16(5, this.radius);
    view.setUint16(7, this.mana);
    view.setUint8(9, this.health);
    view.setUint8(10, this.damage ? 1 : 0)
    view.setUint8(11, this.healing ? 1 : 0)

    return buf;
};