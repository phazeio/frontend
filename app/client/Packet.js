var Packet = {
	// send the handshake packet
	Handshake: function(username) {
		this.username = username;

		this.build = function() {
			var buf = new ArrayBuffer(13 * 2 + 1)
				, view = new DataView(buf);

			// set packet id to 0
			view.setUint8(0, 0);

			// convert username to binary
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


	// shoot event
	Shoot: function() {
		this.build = function() {
			var buf = new ArrayBuffer(1)
				, view = new DataView(buf);

			// set packet id to 3
			view.setUint8(0, 3);

			return buf;
		}
	},

	// heal event
	Heal: function() {
		this.build = function() {
			var buf = new ArrayBuffer(1)
				, view = new DataView(buf);

			// set packet id to 4
			view.setUint8(0, 4);

			return buf;
		}
	},

	// ranked match queue join
	JoinQueue: function(id) {
		this.build = function() {
			var buf = new ArrayBuffer()
				, view = new DataView(buf);

			// set packet id to 5
			view.setUint8(0, 5);
			view.setUint32(1, id);

			return buf;
		}
	}
}