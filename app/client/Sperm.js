var music = new Audio('/audio/sperm.mp3')
	, pop = new Audio('/audio/pop.mp3');

window.onload = function() {
	$('#overlay').fadeIn(1000);

	var nickname = $('#nickname');

	$('#game_form').submit(e => {
		e.preventDefault();
		if(nickname.val().length > 13) {
			alert('Nickname cannot be longer than 13 characters!');
			return;
		}

		// begin game ;)
		sendHandshake(nickname.val());
	})

	var play_btn = document.getElementById('play_btn')
		, mute_btn = document.getElementById('mute_btn');

	play_btn.addEventListener('mouseup', () => {
		$(play_btn).hide();
		$(mute_btn).show();
		music.play()
	});

	mute_btn.addEventListener('mouseup', () => {
		$(mute_btn).hide();
		$(play_btn).show();
		music.pause()
	});
}

