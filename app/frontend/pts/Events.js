var ws = new WebSocket('ws://localhost:80');

ws.onmessage = (o) => {
	var data = JSON.parse(o);

	switch(data.id) {
		case '0x01':
			death(data);
			break
		case '0x02':
			move(data);
			break;
	}
}

function death(data) {

}

function move(data) {
	
}