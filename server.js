const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URI) //( process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

var userSchema = new mongoose.Schema({
  username: {type: String, required: true}
});
var userModel = mongoose.model("User", userSchema);

app.post("/api/exercise/new-user", (req, res) => {
  var user = new userModel({username: req.body.username});
  
  user.save((error, data) => {    
    if(error) {
      res.json({error: "mongo ERROR"});
    } else { 
      res.json({username: data.username, _id: data._id});  
    }
  });  
});

app.get("/api/exercise/users", (req, res) => {
  userModel.find({}).then((users) => {
    var array = [];
    
    users.forEach((user) => {
      array.push({username: user.username, _id: user.id});
    });
    
    res.json({ users: array });
  }).catch((error) => {
    res.json({error: "mongo ERROR"});
  });
});

var exerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: String, required: true},
  date: {type: Date}
});
var exerciseModel = mongoose.model("Exercise", exerciseSchema);

app.post("/api/exercise/add", (req, res) => {
  var date = req.body.date != "" ? new Date(req.body.date) : new Date();
  var exercise = new exerciseModel({userId: req.body.userId, description: req.body.description, duration: req.body.duration, date });
  
  exercise.save((error, data) => {    
    if(error) {
      res.json({error: "mongo ERROR"});
    } else { 
      res.json({userId: data.userId, description: data.description, duration: data.duration, date: data.date});  
    }
  });  
});

app.get("/api/exercise/log", (req, res) => {
  userModel.findOne({_id: req.query.userId}).then((user) => {    
    exerciseModel.find(req.query.from != undefined && req.query.to != undefined ? {userId: req.query.userId, date: {$gte: new Date(req.query.from), $lte: new Date(req.query.to)}} : req.query.from != undefined ? {userId: req.query.userId, date: {$gte: new Date(req.query.from)}} : req.query.to != undefined ? {userId: req.query.userId, date: {$lte: new Date(req.query.to)}} : {userId: req.query.userId}).limit(req.query.limit != undefined ? parseInt(req.query.limit) : 0).then((exercises) => {
      var exerciseCount = 0;
      exercises.forEach((exercise) => {
        exerciseCount++;
      });
        
      res.json({_id: user._id, username: user.username, exerciseCount, log: exerciseCount > 0 ? exercises : "without LOG"});
    }).catch((error) => {
      res.json({error: "mongo ERROR"});
    });
  }).catch((error) => {
    res.json({error: "mongo ERROR"});
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
