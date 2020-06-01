const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const database = []

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

const servers = [];

let qNumber = 0;
app.get('/questionNumber/:sid', (req, res) => {
	//Selects a random number
	//Filters the database according to the server id
	//Changes the qid(question id) of every player that is in that server
	qNumber = Math.round(Math.random() * questions.length);
	const returningUserArray = database.filter(user => user.sid == req.params.sid);
	for(let i = 0; i < returningUserArray.length; i++){
		returningUserArray[i].qid = qNumber;
	}
	res.json(returningUserArray)
})

app.get('/question/:sid', (req, res) => {
	//returns the scores to zero
	//sends the question according to the qid
	const returningUserArray = database.filter(user => user.sid == req.params.sid);
	for(let i = 0; i < returningUserArray.length; i++){
		returningUserArray[i].score = 0;
	}
	res.send(questions[returningUserArray[0].qid-1]);
})

app.get('/', (req, res) => {
	//returns all the users in the database
	res.send(database)
})

app.get('/profile/:sid', (req, res) => {
	//returns all the users with the same sid in the url
	const returningUserArray = database.filter(user => user.sid == req.params.sid);
	res.send(returningUserArray)
})

app.get('/leaderboard/:sid', (req, res) => {
	//returns the leaderboard. Gets the users in the same server
	//then gets the score and stores in an array. then sorts it
	//then pushes in the name array with the name and score
	//NEEDS OPTIMIZATION
	const returningUserArray = database.filter(user => user.sid == req.params.sid);
	const scoreArray = returningUserArray.map(user => {
		return(user.score)
	});
	scoreArray.sort((a,b) => b-a);
	const scoreArray2 = scoreArray.filter(score => score > 0);
	let nameArray = [];
	for(let i = 0; i < scoreArray2.length; i++){
		for(let j = 0; j < returningUserArray.length; j++){
			if(scoreArray2[i] == returningUserArray[j].score){
				nameArray.push(returningUserArray[j].name + ' = ' + returningUserArray[j].score);
			}
		}
	}
	uniqueArray = nameArray.filter((item, pos) => {
	    return (nameArray.indexOf(item) == pos);
	})
	res.send(uniqueArray);
})

app.get('/profile/:sid/:id', (req, res) => {
	//checks the users with the same sid in the url and returns
	//the user with the same id in the second param in the url
	const returningUserArray = database.filter(user => {
		return (user.sid == req.params.sid && user.id == req.params.id);
	});
	res.send(returningUserArray[0].name)
})

app.put('/profile/:sid/:id', (req, res) => {
	//Gets the user with the url the gets the selected name of that user
	//then gets the user with the same selected name then increments the score
	const returningUserArray = database.filter(user => {
		return (user.sid == req.params.sid && user.id == req.params.id);
	})
	returningUserArray[0].selectedName = req.body.selectedName;
	const returningUserArray2 = database.filter(user => {
		return (user.name === returningUserArray[0].selectedName);
	})
	res.json(returningUserArray2[0].score++)
})

app.put('/update/:sid', (req, res) => {
	//only the admin can access
	//changes the is approved 
	const returningUserArray = database.filter(user => {
		return (user.sid == req.params.sid);
	})
	for(let i = 0; i < returningUserArray.length; i++){
		returningUserArray[i].isApproved = req.body.isApproved;
	}
	res.json(returningUserArray)
})

app.get('/getupdate/:sid/:id', (req, res) => {
	//returns the is approved state
	const returningUserArray = database.filter(user => {
		return (user.sid == req.params.sid && user.id == req.params.id);
	})
	res.json(returningUserArray[0].isApproved)
})

app.put('/getupdate/:sid/:id', (req, res) => {
	//changes the isapproved to false
	const returningUserArray = database.filter(user => {
		return (user.sid == req.params.sid && user.id == req.params.id);
	})
	returningUserArray[0].isApproved = false;
	res.json(returningUserArray[0].isApproved)
})

let id1 = 9;
app.post('/signin', (req, res) => {
	database.push({
		id: id1,
		qid: 1,
		sid: req.body.sid,
		name: req.body.name,
		score: 0,
		selectedName: "",
		isApproved: false
	},)
	id1++;
	res.send(database[database.length - 1])
})

app.post('/createParty', (req, res) => {
	servers.push(req.body.sid)
	res.send(servers)
})

app.get('/getParty', (req, res) => {
	res.send(servers)
})

app.listen(3000, () => {
	console.log('App is running on port 3000!');
})










