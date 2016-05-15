var ws = new WebSocket('ws://localhost:3000', 'echo-protocol');

ws.onmessage = (o) => {
	console.log(o)

	// switch(data.id) {
	// 	case '0x01':
	// 		death(data);
	// 		break
	// 	case '0x02':
	// 		move(data);
	// 		break;
	// }
}

function death(data) {

}

function move(data) {
	
}