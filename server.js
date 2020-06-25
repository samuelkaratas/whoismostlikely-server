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


let qNumber = 0;
let qString = '';
io.on('connection', (socket) => {

	socket.on('signin', (userData, callback) => {
		db.select('*').where({ sid: userData.sid }).from('servers').then(data => {
			if(data.length){
				db('users').returning('*').insert({
					name: userData.name,
					sid: userData.sid
				}).then(user => {
					callback(user[0]);
				}).then(bla => {
					socket.join(userData.sid, () => {
						let rooms = Object.keys(socket.rooms);
						db.select('*').from('users').where({ sid: userData.sid }).then(data => {
							io.to(rooms[0]).emit('somebodyJoined', data);
						})
					})
				})
			}else{
				callback(0);
			}
		})
	})

	socket.on('adminPressedShowNextQuestion', (data) => {
		let rooms = Object.keys(socket.rooms);
		db.select(db.raw('COUNT(qid)')).from('questions').then(data => {
			qNumber = Math.round(Math.random() * data[0].count);
		}).then(bla => {
			db.select('question').from('questions').where({ qid: qNumber }).then(qData => {
				qString = qData[0].question;
			})
		}).then(blaData => {
			db('users')
			.where({ 
				sid: data.sid
			})
			.update({ selectedname: '' }, ['selectedname'])
			.then(data2=>{
			  	db.select('*').from('users').where({ sid: data.sid }).then(data => {
					io.to(rooms[0]).emit('question', {question: qString, users: data});
				})
			})
		})
	})

	socket.on('adminPressedShowLeaderboard', (data) => {
		let rooms = Object.keys(socket.rooms);
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
		db('users')
		  .where({ 
			id: data.id
		  })
		  .update({ selectedname: data.key }, ['selectedname'])
		  .then(data2 => {
		  	db('users')
		  	  .returning('score')
			  .where({ 
			  	//sid: req.params.sid,
			  	name: data2[0].selectedname
			  })
			  .increment('score')
			  .then(data3 => {
			  	db.select(db.raw('COUNT(id)')).from('users').where({ sid: data.sid, selectedname: ''}).then(data4 => {
			  		//console.log(data4[0].count);
			  		io.to(rooms[0]).emit('score', data4[0].count);
			  	})
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

app.post('/createParty', (req, res) => {
	db('servers').returning('*').insert({
		sid: req.body.sid
	}).then(data => {
		res.json(data);
	}).catch(err => res.status(400).json('error creating party'))
})

