var WebSocketServer
  , wss
  , Events = require('./Events');

/*
* @param server - reference to HTTP Server object
*/
module.exports.startWebSocketServer = function(server) {
  console.log('Socket Server running...');

  WebSocketServer = require('websocket').server
    , wss = new WebSocketServer({
      // reference to http in server.js
      httpServer: server,
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
   
  wss.on('request', function(request) {
      if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin 
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
      }
      
      var connection = request.accept('echo-protocol', request.origin);
      console.log('WS: Connection accepted.');
      connection.on('message', function(message) {
        // console.log(message.utf8Data)
          if (message.type === 'utf8') {
            // try {
              var msg = JSON.parse(message.utf8Data);
              if(msg.id === 'handshake')
                msg.socket = connection;
              Events[msg.id](msg);
            // } catch(e) {
            //   console.log('not json message... hmmm')
            // }
          }
          else if (message.type === 'binary') {
              console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
              connection.sendBytes(message.binaryData);
          }
      });

      connection.on('close', function(reasonCode, description) {
          console.log('WS: Closed connection.');
      });
  });
}