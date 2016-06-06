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
	, http		 	= require('http').Server(app);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

http.listen(3000, err => {
	if(err)
		return console.log(err);

	console.log('Running...')
})

require('./app/server/Game').Game.start(http);