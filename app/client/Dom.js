var music 	= new Audio('/audio/813.mp3')
	, click	= new Audio('/audio/click.ogg')
	, pop 	= new Audio('/audio/pop.mp3')
	, twitterAuth;

window.userLoggedIn = function(user) {
	document.getElementById('profile').style.display = 'block';
	document.getElementById('profile-picture').src = user.profile_image_url_https
	twitterAuth.close();

	// get user information
	
	Cookies.set('id', user.id);
}

window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};

window.onload = function() {
	/*	twitter */
	$('#login-twitter').on('click', function() {
    	twitterAuth = window.open("/request-token", "_blank", "scrollbars=1,resizable=1,height=300,width=450");
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

	gridCanvas.width = window.innerWidth ;
	gridCanvas.height = window.innerHeight;

	grid.fillStyle = '#f2f2f2';
	grid.fillRect(0,0,window.innerWidth,window.innerHeight);

	grid.fillStyle = '#333333';
	grid.shadowColor = '#cccccc';
	grid.shadowBlur = 5;
	grid.shadowOffsetX = 0;
	grid.shadowOffsetY = 0;

	for(var j = 0; j < window.innerWidth; j+=50)
		grid.fillRect(j, 0, 0.3, window.innerHeight);

	for(var j = 0; j < window.innerHeight; j+=50)
		grid.fillRect(0, j, window.innerWidth, 0.3);
}

window.addEventListener('resize', function() {
	if(client.inGame)
		return;

	drawGrid();
})

connectingAnimation();

function startConnecting() {
	var nick = document.getElementById('nickname');
	nick.placeholder = 'Connecting.';
    nick.disabled = true;

    var playBtn = document.getElementById('play_button');
    playBtn.disabled = true;
    playBtn.className = 'disabled';

	setTimeout(client.loadServer.bind(client), 3000);
	connectingAnimation();	
}

var conInt;

function connectingAnimation() {
	var j = true;

	conInt = setInterval(connecting, 500);

	function connecting() {
		var nick = document.getElementById('nickname');

		switch(nick.placeholder) {
			case 'Connecting.':
					j = true;
					nick.placeholder = 'Connecting..';
				break;
			case 'Connecting..':
				if(j)
					nick.placeholder = 'Connecting...';
				else
					nick.placeholder = 'Connecting.'
				break;
			case 'Connecting...':
				j = false;
				nick.placeholder = 'Connecting..';
				break;
			default:
				clearInterval(conInt);
				break;
		}
	}
}