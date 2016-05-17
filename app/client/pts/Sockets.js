var ws = new WebSocket('ws://localhost:3000', 'echo-protocol');

ws.onmessage = (o) => {
	var msg = JSON.parse(o.data);
	messages[msg.id](msg);
}

var messages = {
	handshake: function(h) {
		console.log(h)
		startGame(h);
	},

	game: function(g) {
		Game.food = g.food;
		Game.players = g.players;
	}
}

SpermEvent.on('player_move_event', e => {
	ws.send(JSON.stringify({id:'move', player: e.player}));
})

SpermEvent.on('player_eat_event', e => {
	ws.send(JSON.stringify({id: 'eat', player: e.player, food: e.food}));
})