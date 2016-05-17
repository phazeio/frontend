var ws = new WebSocket('ws://localhost:3000', 'echo-protocol');

ws.onmessage = (o) => {
	try {
		var msg = JSON.parse(o);
		messages[o.name](msg);
	} catch(e) {
		console.log('cannot parse the json :o')
	}
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