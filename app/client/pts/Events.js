function EventEmitter() {
	this.listeners = {};

	this.on = (eventName, callback) => {
		if (this.listeners[eventName])
			this.listeners[eventName].push(callback);
		else
			this.listeners[eventName] = [callback];
	}

	this.emit = (eventName, data) => {
		if (this.listeners[eventName])
			this.listeners[eventName].forEach(h => h(data));
	}
}

var SpermEvent = new EventEmitter();

/*
* [0] player_move_event - player moved
* [1] player_eat_event - player eats food
* [2] player_death_event - player died
* [3] idk
*
*/

SpermEvent.on('player_eat_event', e => {
	pop.play();
})

SpermEvent.on('player_move_event', e => {
	$('#player_x').text(~~e.player.x);
	$('#player_y').text(~~e.player.y);
})