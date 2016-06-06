var ws = new WebSocket('ws://localhost:3000', 'echo-protocol');

ws.onmessage = (o) => {
	var msg = JSON.parse(o.data);
	messages[msg.id](msg);
}

var messages = {
	handshake: function(data) {
		startGame(data);
	},

	game: function(data) {
		Game.Player.score = data.update.player.score;
		Game.Player.x = data.update.player.x;
		Game.Player.y = data.update.player.y;

		data.update.food.forEach(e => {
			var f = findFood(e._id);
			if(f === null && e.chained === false)
				return Game.food.push(new Food(e.x, e.y, e.color, e._id))

			f.x = e.x;
			f.y = e.y;
			f.color = e.color;
			f.radius = e.radius;
		});

		data.update.players.forEach(e => {
			var p = findPlayer(e._id);
			if(p === null)
				return Game.players.push(new Player(e.username, e.x, e.y, e._id, e.color));

			p.x = e.x;
			p.y = e.y;
			// p.impact = e.impact;
			p.radius = e.radius;
		})

		// update food
		for(var j = 0; j < Game.food.length; j++) {
			var f = Game.food[j];

			var u_f = afindFood(data.update.food, f._id);
			if(u_f === null) {
				Game.food.splice(j, 1);
				j--;
				continue;
			}
		}

		// update players
		for(var j = 0; j < Game.players.length; j++) {
			var p = Game.players[j];

			var u_p = afindPlayer(data.update.players, p._id);
			if(u_p === null) {
				Game.players.splice(j, 1);
				j--;
				continue;
			}

		}
		// Game.Player.food = [];

		// data.update.player.food.forEach(e => {
		// 	Game.Player.food.push(new Food(e.x, e.y, e.color, e._id));
		// })
	},

	disconnect: function(data) {
		// player disconnected
	}
}

SpermEvent.on('player_move_event', e => {
	ws.send(JSON.stringify({id: 'player_move', player: e.player}));
})

SpermEvent.on('food_move_event', e => {
	ws.send(JSON.stringify({id: 'food_move', food: e.food}));
})

SpermEvent.on('player_eat_event', e => {
	ws.send(JSON.stringify({id: 'eat', player: e.player, food: e.food}));
})

SpermEvent.on('angle_update', e => {
	ws.send(JSON.stringify({id: 'angle_update', angle: e.angle}));
})