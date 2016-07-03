var ws;

function connectToSocketServer() {
	ws = new WebSocket('ws://localhost:3000', 'echo-protocol');
};

ws.onmessage = (o) => {
	if(o.data) {
		var msg = JSON.parse(o.data);
		messages[msg.id](msg);
	} else
		messages[msg.id]();
}

var messages = {
	handshake: function(data) {
		console.log('what');

		startGame(data);
	},

	game: function(data) {
		Game.Player.score = data.update.player.score;
		Game.Player.x = data.update.player.x;
		Game.Player.y = data.update.player.y;
		Game.Player.health = data.update.player.health;
		Game.Player.damage = data.update.player.damage;

		data.update.food.forEach(e => {
			var f = findFood(e._id);
			if(f === null && e.chained === false)
				return Game.food.push(new Food(e.x, e.y, e.color, e._id))

			f.x = e.x;
			f.y = e.y;
			f.color = e.color;
			f.radius = e.radius;
		});

		data.update.shards.forEach(e => {
			var s = findShard(e._id);
			if(s === null)
				return Game.shards.push(new Shard(e.x, e.y, e.radius, e._id, e.updated));

			s.x = e.x;
			s.y = e.y;
			s.updated = e.updated;
		})

		data.update.players.forEach(e => {
			var p = findPlayer(e._id);
			if(p === null)
				return Game.players.push(new Player(e.username, e.x, e.y, e._id, e.color));

			p.x = e.x;
			p.y = e.y;
			p.updated = e.updated;
			p.damage = e.damage;
			// p.impact = e.impact;
			p.radius = e.radius;
		})

		// Game.Player.food = [];

		// data.update.player.food.forEach(e => {
		// 	Game.Player.food.push(new Food(e.x, e.y, e.color, e._id));
		// })
	},

	rankings: function(data) {
		Game.top = data.leaderboard[0].score;

		var str = '';
		for(var j = 0; j < data.leaderboard.length; j++)
			str += '<li>' 
			+ '<span>' + (j + 1) + '. </span>'
			+ '<span>' + (data.leaderboard[j].username ? data.leaderboard[j].username : 'unnamed shooter') + '</span>' 
			+ '<span>' + data.leaderboard[j].score + '</span>' 
			+ '</li>';

		document.getElementById('leaderboard').innerHTML = str;
	},

	alert: function(data) {
		addAlert(data.alert);
	},

	die: function(data) {
		ws.close();
		stopGame();
	},

	disconnect: function(data) {
		// player disconnected
	}
}