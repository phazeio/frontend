// lol
CanvasRenderingContext2D.prototype.roundRect = 
 
function(x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  this.beginPath();
  this.moveTo(x + radius, y);
  this.lineTo(x + width - radius, y);
  this.quadraticCurveTo(x + width, y, x + width, y + radius);
  this.lineTo(x + width, y + height - radius);
  this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  this.lineTo(x + radius, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - radius);
  this.lineTo(x, y + radius);
  this.quadraticCurveTo(x, y, x + radius, y);
  this.closePath();
  if (stroke) {
    this.stroke();
  }
  if (fill) {
    this.fill();
  }        
}

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

