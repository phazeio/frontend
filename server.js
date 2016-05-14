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

var WebSocketServer = require('websocket').server;
 
wsServer = new WebSocketServer({
    httpServer: http,
    // You should not use autoAcceptConnections for production 
    // applications, as it defeats all standard cross-origin protection 
    // facilities built into the protocol and the browser.  You should 
    // *always* verify the connection's origin and decide whether or not 
    // to accept it. 
    autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}
 
wsServer.on('request', function(request) {
    // if (!originIsAllowed(request.origin)) {
    //   // Make sure we only accept requests from an allowed origin 
    //   request.reject();
    //   console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    //   return;
    // }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
            connection.sendUTF('swag');
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

http.listen(3000, err => {
	if(err)
		return console.log(err);

	console.log('Running...')
})