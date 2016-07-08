var music 	= new Audio('/audio/813.mp3')
	, click	= new Audio('/audio/click.ogg')
	, pop 	= new Audio('/audio/pop.mp3');

window.onload = function() {
	/*	twitter */
	$('#login-twitter').on('click', function() {
    	var twitterAuth = window.open("/request-token", "_blank", "scrollbars=1,resizable=1,height=300,width=450");

    	twitterAuth.on('success', function(e) {
    		console.log(e);
    	})
    });

	$('#overlay').fadeIn(1000);

	drawGrid();

	var nickname = $('#nickname');

	$('#game_form').submit(e => {
		e.preventDefault();
		if(nickname.val().length > 13) {
			alert('Nickname cannot be longer than 13 characters!');
			return;
		}

		click.play();
		client.ws.send((new Packet.Handshake(nickname.val())).build());

	})

	$('.enabled').click(function() {
		click.play();
	})

	window.addEventListener('keyup', function(e) {
		if(e.keyCode !== 32)
			return;

		client.ws.send((new Packet.Heal()).build());
	});

	// var play_btn = document.getElementById('play_btn')
	// 	, mute_btn = document.getElementById('mute_btn');

	// play_btn.addEventListener('mouseup', () => {
	// 	$(play_btn).hide();
	// 	$(mute_btn).show();
	// 	music.play()
	// });

	// mute_btn.addEventListener('mouseup', () => {
	// 	$(mute_btn).hide();
	// 	$(play_btn).show();
	// 	music.pause()
	// });
}

function drawGrid() {
	var gridCanvas = document.getElementById('grid')
		, grid = gridCanvas.getContext('2d');

	gridCanvas.width = window.innerWidth;
	gridCanvas.height = window.innerHeight;

	grid.fillStyle = '#f2f2f2';
	grid.fillRect(0,0,window.outerWidth,window.outerHeight);

	grid.fillStyle = '#333333';
	grid.shadowColor = '#cccccc';
	grid.shadowBlur = 5;
	grid.shadowOffsetX = 0;
	grid.shadowOffsetY = 0;

	for(var j = 0; j < window.outerWidth; j+=50)
		grid.fillRect(j, 0, 0.3, window.innerHeight);

	for(var j = 0; j < window.outerHeight; j+=50)
		grid.fillRect(0, j, window.innerWidth, 0.3);
}