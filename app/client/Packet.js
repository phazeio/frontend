var Packet = {
	// complete the handshake packet
	Handshake: function(username) {
		this.username = username;

		this.build = function() {
			var buf = new ArrayBuffer(13 * 2 + 1)
				, view = new DataView(buf);

			view.setUint8(0, 0);

			for(var j = 0; j < this.username.length; j++) {
				view.setUint16(((j + 1) * 2), this.username.charCodeAt(j));
			}

			return buf;
		}
	},

	// mouse event object
	MouseMove: function(mouse) {
		this.x = mouse.clientX - window.innerWidth / 2;
		this.y = mouse.clientY - window.innerHeight / 2 - 50;

		this.build = function() {
			var buf = new ArrayBuffer(5)
				, view = new DataView(buf);

			view.setUint8(0, 2);
			view.setFloat32(1, ((Math.atan2(this.y, this.x) + Math.PI * 2) % (Math.PI * 2)));

			return buf;
		}
	},


	Shoot: function() {
		this.build = function() {
			var buf = new ArrayBuffer(1)
				, view = new DataView(buf);

			view.setUint8(0, 3);

			return buf;
		}
	},

	Heal: function() {
		this.build = function() {
			var buf = new ArrayBuffer(1)
				, view = new DataView(buf);

			view.setUint8(0, 4);

			return buf;
		}
	}
}