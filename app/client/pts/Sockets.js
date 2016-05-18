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
		data.update.food.forEach(e => {
			var f = findFood(e._id);
			if(f === null && e.chained === false)
				return Game.food.push(new Food(e.x, e.y, e.color, e._id))

			f.x = e.x;
			f.y = e.y;
			f.radius = e.radius;
		});

		data.update.players.forEach(e => {
			var p = findPlayer(e._id);
			if(p === null)
				return Game.players.push(new Player(e.username, e.x, e.y, e._id, e.color));

			p.x = e.x;
			p.y = e.y;
			p.radius = e.radius;
			p.food = [];

			e.food.forEach(e => {
				p.food.push(new Food(e.x, e.y, e.color, e._id));
			})
		})

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