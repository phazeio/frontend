var mongoose 		= require('mongoose')
	Schema			= mongoose.Schema;

var userSchema 		= new Schema({
	/*	twitter id	*/
	_id: String,

	/*	twitter username	*/
	username: String,

	/*	elo rating	*/
	elo: Number,

	/*	out of all elo	*/
	rank: Number,

	/*	last seen 	*/
	lastSeen: Number,

	/*	created at	*/
	createdAt: Number,

	/*	wins	*/
	wins: Number,

	/*	losses	*/
	losses: Number
})

var matchSchema = new Schema({
	/*	killer id 	*/
	winner: {
		type: String,
		ref: 'User'
	},

	/*	victim	*/
	loser: {
		type: String,
		ref: 'User'
	},

	/*	winner's previous rating	*/
	winnerPreviousEloRating: Number,

	/*	loser's previous rating	*/
	loserPreviousEloRating: Number,

	/*	elo increase / decrease amount	*/
	elo: Number,

	/*	duration of match	*/
	duration: Number,

	/* date created	*/
	createdAt: Number,
})

var daemonSchema 	= ({
	/*	address of daemon	*/
	hostname: String,

	/*	region of machine	*/
	region: String,

	/*	number of apps daemone should run	*/
	apps: {
		type: Array,
		default: {
			gamemode: 1,
			maxPlayers: 80,
			port: 1501
		}
	},

	/*	if the server is active	*/
	online: Boolean
});

module.exports = {
	Match: mongoose.model('match', matchSchema),
	User: mongoose.model('user', userSchema),
	Daemon: mongoose.model('daemon', daemonSchema)
}