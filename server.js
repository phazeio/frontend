/*
* ================================
*
*			  IO_GAME
*
*				by
*
*	Coltrane Nadler & Ben Orgera
*
* ================================
*/


var express 		= require('express')
	, app 			= express()
	, morgan 		= require('morgan')
	, websocket 	= require('websocket')
	, redis 		= require('redis')
	, http		 	= require('http').Server(app)
	, GameServer 	= require('./app/server/GameServer');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('*', (req, res) => res.json(404));

http.listen(3000, err => {
	if(err)
		return console.log(err);

	console.log('Running...')
})

GameServer.start();

var commands = {
	'list': function() {
		var str = '';

		str += '[ ' + GameServer.nodesPlayer.length + ' / ' + GameServer.config.serverMaxConnections + ' ] Shooters Online\n';
		if(GameServer.nodesPlayer.length === 0)
			str += 'No shooters currently online...';
		else
			GameServer.nodesPlayer.forEach(p => str += p.username ? p.username + ', ' : 'an unamed shooter, ');
		
		console.log(str);
	},

	'nodes': function() {
		var str = '';

		str += '[ ' + GameServer.nodes.length + ' ] Nodes Active\n';

		if(GameServer.nodes.length === 0)
			str += 'No nodes currently active...';
		else
			GameServer.nodes.forEach(n => str += n.username ? n.username + ', ' : 'NpN, ');

		console.log(str);
	},

	'clients': function() {
		var str = '';

		str += '[ ' + GameServer.clients.length + ' ] Clients Connected';

		console.log(str);
	},

	'alert': function(alert) {
		GameServer.alert(alert);

		console.log('[ Alert ] Alerted: ' + alert);
	},

	'crash': function(name) {
		console.log(' [ Crash ] Attempting to crash ' + name);
		GameServer.crash(name);
	},

	'help': function() {
		var str = '';

		str += '-------------------------------------------------------------';
		str += '\n  • help := list help commands';
		str += '\n  • list := list online shooters';
		str += '\n  • clients := list connected clients';
		str += '\n  • nodes := list all nodes';
		str += '\n  • alert <alert> := alert message to all shooters';
		str += '\n  • crash <name> := for the lolz';
		str += '\n-------------------------------------------------------------';

		console.log(str);
	}
}

process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');

process.stdin.on('data', function (text) {
	text = text.slice(0, text.indexOf('\n'));
	text = text.split(' ');
	if(commands[text[0]])
		commands[text[0]](text.slice(1, text.length).join(' '));
	else
		console.log('Unknown command. Type /help for help.');

	if (text === 'quit\n') {
	  done();
	}
});

function done() {
	console.log('Now that process.stdin is paused, there is nothing more to do.');
	process.exit();
}