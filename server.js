const express = require('express');
const socketio = require('socket.io')
const cors = require('cors');
const app = express();
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'samuelkaratas',
    password : '',
    database : 'wiml-db'
  }
});

app.use(express.json());
app.use(cors());

const expressServer = app.listen(3000, () => {
	console.log('App is running on port 3000!');
})
const io = socketio(expressServer, {
  pingTimeout: 60000,
});

//For testing
const questions = [
	{
		qid: 001,
		question: "Most likely to burn down their home for the insurance money?"
	},
	{
		qid: 002,
		question: "Most likely to secretly run a meth lab?"
	},
	{
		qid: 003,
		question: "Most likely to want to build a wall between Mexico and the U.S.?"
	},
	{
		qid: 004,
		question: "Most likely to become a liability after two drinks?"
	},
	{
		qid: 005,
		question: "Most likely to appear on the NO FLY LIST?"
	},
	{
		qid: 006,
		question: "Most likely to turn up drunk to pre-drinks?"
	},
	{
		qid: 007,
		question: "Who has secretly done something VERY illegal and gotten away with it?"
	},
	{
		qid: 008,
		question: "Most likely to become a vegetarian because their partner wanted them to?"
	},
	{
		qid: 009,
		question: "Most likely to laugh if they saw a blind person trip?"
	},
	{
		qid: 010,
		question: "If we were all characters in a horror movie, who would get killed first?"
	},
	{
		qid: 011,
		question: "Who can't go 10 minutes without looking at themselves in the mirror??"
	},
	{
		qid: 012,
		question: "Most likely to say I love you too early?"
	},
	{
		qid: 013,
		question: "Most likely to accidentally have drugs on them while going through airport security?"
	},
	{
		qid: 014,
		question: "Who is the worst person to call for relationship advice?"
	},
	{
		qid: 015,
		question: "Least likely to believe in global warming?"
	},
	{
		qid: 016,
		question: "In their lifetime, who will most likely need a liver transplant?"
	},
	{
		qid: 017,
		question: "If a big fire broke out right now, who would push everyone out of the way to get out first?"
	},
	{
		qid: 018,
		question: "Who would be the most successful serial killer?"
	},
	{
		qid: 019,
		question: "Most likely to have a mid- life crisis?"
	},
	{
		qid: 020,
		question: "Who would be the worst phone sex operator?"
	},
	{
		qid: 021,
		question: "Most likely to ask an overweight woman if she's pregnant?"
	},
	{
		qid: 022,
		question: "Who will be the most difficult old person to be around?"
	},
	{
		qid: 023,
		question: "If a private investigator did a background check on all of us, whose would be the most unsettling?"
	},
	{
		qid: 024,
		question: "Who will be the next person to get punched in the face?"
	},
	{
		qid: 025,
		question: "Most likely to get a tattoo they will later regret?"
	},
	{
		qid: 026,
		question: "Most likely to get upset playing WIML?"
	},
	{
		qid: 027,
		question: "Most likely to create a scam business?"
	},
	{
		qid: 028,
		question: "Who should be banned from creating offspring?"
	},
	{
		qid: 029,
		question: "Who has probably successfully blackmailed someone?"
	},
	{
		qid: 030,
		question: "Who's the most high maintenance in a relationship? "
	}
]

let qNumber = 0;
io.on('connection', (socket) => {

	socket.on('signin', (userData, callback) => {
		console.log(userData);
		db.select('*').where({ sid: userData.sid }).from('servers').then(data => {
			if(data.length){
				console.log('Greater than zero');
				db('users').returning('*').insert({
					name: userData.name,
					sid: userData.sid
				}).then(user => {
					console.log(user);
					callback(user[0]);
				})
				socket.join(userData.sid, () => {
					let rooms = Object.keys(socket.rooms);
		    		console.log(rooms[0]);
		    		io.to(rooms[0]).emit('a new user has joined the room')
				})
			}else{
				console.log('zero')
				callback(0);
			}
		})
	})

	socket.on('adminPressedShowNextQuestion', (data) => {
		qNumber = Math.round(Math.random() * questions.length);
		console.log(questions[qNumber-1].question);
		let rooms = Object.keys(socket.rooms);
		console.log(rooms[0]);
		db.select('*').from('users').where({ sid: data.sid }).then(data => {
			io.to(rooms[0]).emit('question', {question: questions[qNumber].question, users: data});
		})
	})

	socket.on('adminPressedShowLeaderboard', (data) => {
		let rooms = Object.keys(socket.rooms);
		console.log(rooms[0]);
		db.select('selectedname', db.raw('COUNT(id)'))
		.from('users')
		.where({ sid: data.sid })
		.groupBy('selectedname')
		.orderBy('count', 'desc')
		.then(data2 => {
			/* SEND THE USERS WHO SELECTED THEM
			for(let i = 0; i < data2.length; i++){
				db.select('name').from('users').where({
					sid: data.sid,
					selectedname: data2[i].selectedname
				}).then(names => {
					//console.log('names', names);
					for (let j = 0; j < data2[j].count ; j++) {
						data2[i].selectedNames += names[j].name
					}
				})
			}
			//console.log('namesArray', namesArray);
			console.log('data2', data2);*/
			io.to(rooms[0]).emit('leaderboard', data2);
		}).catch(err => res.status(400).json('unable to get leaderboard'))
	})

	socket.on('nameSelected', (data) => {
		let rooms = Object.keys(socket.rooms);
		console.log(rooms[0]);
		console.log(data.key);
		db('users')
		  .where({ 
			id: data.id
		  })
		  .update({ selectedname: data.key }, ['selectedname'])
		  .then(data => {
		  	db('users')
		  	  .returning('score')
			  .where({ 
			  	//sid: req.params.sid,
			  	name: data[0].selectedname
			  })
			  .increment('score')
			  .then(data => {
			  	io.to(rooms[0]).emit('score', data);
			  }).catch(err => res.status(400).json('unable to update the score'))
		  }).catch(err => res.status(400).json('unable to add the selected name'))
	})

	socket.on('deleteServer', (data) => {
		let rooms = Object.keys(socket.rooms);
		db('servers').where({
			sid: data.sid
		}).del().then(data2 => {
			db('users').where({
				sid: data.sid
			}).del().then(data3 => {
				socket.disconnect(true);
				io.to(rooms[0]).emit('adminDisconnected');
			})
		})
	})

	socket.on('signout', data => {
		let rooms = Object.keys(socket.rooms);
		db('users').where({
			id: data.id
		}).del().then(data2 => {
			socket.disconnect(true);
			io.to(rooms[0]).emit('somebodyDisconnected', data.id);
		})
	})

})



/*
let qNumber = 0;
app.get('/questionNumber/:sid', (req, res) => {
	//Selects a random number
	//Filters the database according to the server id
	//Changes the qid(question id) of every player that is in that server
	qNumber = Math.round(Math.random() * questions.length);
	db('servers')
	  .where({ sid: req.params.sid })
	  .update({ qid: qNumber }, ['qid'])
	  .then(data => {
	  	res.json(questions[data[0].qid-1].question);
	  }).catch(err => res.status(400).json('unable to update question number'))
})*/

/*
app.get('/question/:sid', (req, res) => {
	//returns the scores to zero
	//sends the question according to the qid
	db.select('qid').from('servers').where({ sid: req.params.sid}).then(data => {
		res.json(questions[data[0].qid-1].question);
	}).catch(err => res.status(400).json('unable to get question'))
})*/
/*
app.get('/profile/:sid', (req, res) => {
	//returns all the users with the same sid in the url
	db.select('*').from('users').where({ sid: req.params.sid }).then(data => {
		res.json(data);
	}).catch(err => res.status(400).json('unable to get users'))
})*/
/*
app.get('/leaderboard/:sid', (req, res) => {
	//returns the leaderboard. Gets the users in the same server
	//then gets the score and stores in an array. then sorts it
	//then pushes in the name array with the name and score
	//NEEDS OPTIMIZATION
	db.select('selectedname', db.raw('COUNT(id)'))
		.from('users')
		.where({ sid: req.params.sid })
		.groupBy('selectedname')
		.orderBy('count', 'desc')
		.then(data => {
			res.json(data);
		}).catch(err => res.status(400).json('unable to get leaderboard'))
})*/
/*
app.put('/profile/:sid/:id', (req, res) => {
	//Gets the user with the url the gets the selected name of that user
	//then gets the user with the same selected name then increments the score
	db('users')
	  .where({ 
		sid: req.params.sid,
		id: req.params.id
	  })
	  .update({ selectedname: req.body.selectedname }, ['selectedname'])
	  .then(data => {
	  	db('users')
	  	  .returning('score')
		  .where({ 
		  	sid: req.params.sid,
		  	name: data[0].selectedname
		  })
		  .increment('score')
		  .then(data => {
		  	res.json(data);
		  }).catch(err => res.status(400).json('unable to update the score'))
	  }).catch(err => res.status(400).json('unable to add the selected name'))
})*/
/*
app.put('/update/:sid', (req, res) => {
	//only the admin can access
	//changes the is approved 
	db('users')
	  .where({ sid: req.params.sid })
	  .update({ isapproved: req.body.isapproved }, ['id', 'isapproved'])
	  .then(data => {
	  	res.json(data);
	  }).catch(err => res.status(400).json('unable to update is approved'))
})

app.get('/getupdate/:sid/:id', (req, res) => {
	//returns the is approved state
	const { sid, id } = req.params;
	db.select('isapproved').from('users').where({
		id: id
	}).then(data => {
		res.json(data[0].isapproved);
	}).catch(err => res.status(400).json('unable to get is approved'))
})

app.put('/getupdate/:sid/:id', (req, res) => {
	//changes the isapproved to false
	db('users')
	  .where({ id: req.params.id })
	  .update({ isapproved: false }, ['id', 'isapproved'])
	  .then(data => {
	  	res.json(data[0].isapproved);
	  }).catch(err => res.status(400).json('unable to update is approved to false'))
})*/
/*
app.post('/signin', (req, res) => {
	const { sid, name } = req.body;
	db('users').returning('*').insert({
		name: name,
		sid: sid
	}).then(user => {
		res.json(user[0])
	}).catch(err => res.status(400).json('unable to signin'))
})*/

app.post('/createParty', (req, res) => {
	db('servers').returning('*').insert({
		sid: req.body.sid
	}).then(data => {
		res.json(data);
	}).catch(err => res.status(400).json('error creating party'))
})
/*
app.get('/getParty', (req, res) => {
	db.select('*').from('servers').then(data => {
		res.json(data);
	}).catch(err => res.status(400).json('unable to get party'))
})*/
/*
app.post('/signout', (req, res) => {
	db('users').where({
		id: req.body.id
	}).del().then(data => res.json(data))
})*/
/*
app.post('/deleteServer', (req, res) => {
	//only admin can delete server
	db('servers').where({
		sid: req.body.sid
	}).del().then(data => {
		db('users').where({
			sid: req.body.sid
		}).del().then(data2 => res.json(data2))
	})
})*/



