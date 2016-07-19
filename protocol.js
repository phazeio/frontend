// entity
[
	0, // player, food, shard
	192918821, // _id
	1293, // x coord
	9210, // y coord
	12993912939, // color
	40, // radius
	50, // mana if player
	100, // health if player
	1029391923, // time - last updated
	'name', // if player
]	


* is a server sent packet

0 - handshake
1 - handshake confirm *
2 - mouse move
3 - shoot
4 - heal 
14 - move *
16 - damage *
18 - some shit
20 - update *
21 - spawn player *
22 - spawn non player *
23 - update player *
24 - update nonplayer *
25 - drop node *
40 - stats *
90 - die *
100 - alert *
101 - crash *

spawn entitiy when it gets into view

on updates if its already in view, just update the update time for food, and for shards and players x and y and players radius