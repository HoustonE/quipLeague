/**
Ethan Houston
Quiplash Score tracker
2020-03
**/

//jshint esversion:6
require('dotenv').config();

// ****** NPM Requirements ******

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const ordinal = require('ordinal');
// const moment = require('moment');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));

// ****** Session ******

app.use(session({
  secret: "POIUuyhiBKJBoihjOUGouyFOPUIYfHJgjHObnNVbcRDresEcvCZXzwERWp",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


// ****** Mongoose ******

mongoose.connect('mongodb://localhost:27017/quipDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
mongoose.set("useCreateIndex", true);

// ****** UserSchema ******

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    name: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// ****** Passport ******

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// ****** GoogleAuth2.0 ******

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/quipleague",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({googleId: profile.id, name: profile.displayName , email: profile.emails[0].value}, function(err, user) {
      return cb(err, user);
    });
  }
));


// ****** League Schema ******

const sessionScoreSchema = new mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId,
  sessionId: Number,
  sessionDate: Date,
  //playerId: playerSchema,
  gameType: String,
  score: Number,
  position: Number
});

const SessionScore = new mongoose.model("SessionScore", sessionScoreSchema);


const playerSchema = new mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId,
  playerName: String,
  playerAliases: [String],
  playerEmail: String,
  sessionScores: [sessionScoreSchema]
});

const Player = new mongoose.model("Player", playerSchema);

// ****** REST ******
// -- Home
app.route("/")
  .get(function(req, resp) {
    Player.aggregate([{$unwind: "$sessionScores"},
      {$group: {_id: "$playerName", aliases: {$addToSet: "$playerAliases"}, totalScore: {$sum: "$sessionScores.score"}}},
      {$sort: {totalScore: -1}}],
      function(err, results) {
      if (err) {
        console.log(err);
      } else {
        // console.log(results);
        resp.render("home", {leaderboard: results});
      }
    });
  });

// -- Login
app.route("/login")
  .get(function(req, resp) {
    resp.render("login");
  })
  .post(function(req, resp) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, resp, function() {
          resp.redirect("/");
        });
      }
    });
  });

// -- Register
app.route("/register")
  .get(function(req, resp) {
    resp.render("register");
  })
  .post(function(req, resp) {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        resp.redirect("/register");
      } else {
        passport.authenticate("local")(req, resp, function() {
          resp.redirect("/");
        });
      }
    });
  });

// -- GoogleAuth
app.route("/auth/google")
  .get(
    passport.authenticate("google", {
      scope: ["profile", "email"]
    })
  );

app.route("/auth/google/quipleague")
  .get(passport.authenticate('google', {failureRedirect: '/login'}),function(req, resp) {
      resp.redirect('/');
    }
  );

// -- Match list
app.route("/match-list")
  .get(function(req, resp){
    const pipeline = [
    {$unwind: "$sessionScores"},
    {$group: {_id: '$sessionScores.sessionId', topScore: {$max: '$sessionScores.score'},players: {$push: {matchNum: '$sessionScores.sessionId', date: '$sessionScores.sessionDate', name: '$playerName', score: '$sessionScores.score'}}}},
    {$project: {_id: 0, tops: {$setDifference: [{$map: {input: '$players', as: 'player', in: {'$cond': [{"$eq": ["$topScore", "$$player.score"]},"$$player",false]}}},[false]]}}},
    {$unwind: '$tops'},
    {$project: {matchNum: '$tops.matchNum', date: '$tops.date', name: '$tops.name', score: '$tops.score'}},
    {$sort: {matchNum: 1}}
    ];

    Player.aggregate(pipeline, function(err, results){
      if(err){
        console.log(err);
      } else {
          resp.render("match-list", {matches: results});
      }
    });
  });


// -- Player
app.route("/player/:playerName")
  .get(function(req, resp){
    const thisPlayerName = _.camelCase(req.params.playerName);
    console.log(thisPlayerName.replace(/([a-z0-9])([A-Z])/g, '$1 $2'));

    Player.findOne({playerName: { $regex: '^'+thisPlayerName.replace(/([a-z0-9])([A-Z])/g, '$1 $2')+'$', $options: "i"}},
      function(err, foundPlayer){
        if(err){
          console.log(err);
          // alert(err);
        } else {
          if(!foundPlayer){
            console.log("player not found :(");
            // alert("player not found :(");
            resp.redirect("/");
          } else {
            resp.render("player", {playerName: foundPlayer.playerName, thisPlayer: foundPlayer, loggedIn: req.isAuthenticated()});
          }
        }
      }
    );
  })
  .post(function(req, resp){

    const newSessionScore = new SessionScore(
      {
        sessionId: req.body.matchID,
        sessionDate: req.body.matchDate,
        gameType: req.body.gameType,
        score: req.body.score
      }
    );

    console.log(newSessionScore);

    Player.findById(req.body.playerId, function(err, foundPlayer){
      if(err){
        console.log(err);
        // alert(err);
      } else {
        if(!foundPlayer){
          console.log("player not found :(");
          // alert("player not found :(");
          resp.redirect("/");
        } else {
          const newAlias = req.body.alias;
          console.log(newAlias);
          if (foundPlayer.playerAliases.includes(newAlias) === false && newAlias !== "" ) {
             foundPlayer.playerAliases.push(newAlias);
          }

          foundPlayer.sessionScores.push(newSessionScore);
          foundPlayer.save();
          resp.render("player", {playerName: foundPlayer.playerName, thisPlayer: foundPlayer});
        }
      }});

  });

// -- Match
app.route("/match/:matchNumber")
  .get(function(req, resp){
    const sessionNum = req.params.matchNumber;

    const pipeline = [{$unwind: "$sessionScores"},
    {$project: {'matchNum': '$sessionScores.sessionId', 'sessionDate' : '$sessionScores.sessionDate', 'playerName': '$playerName', 'gameType': '$sessionScores.gameType', 'score': '$sessionScores.score'}},
    {$match: {matchNum: Number(sessionNum)}},
    {$sort: {score: -1}}];

    Player.aggregate(pipeline, function(err, results){

      if(err){
        console.log(err);
        // alert(err);
      } else {
        if(!results){
          console.log("player not found :(");
          // alert("player not found :(");
          resp.redirect("/");
        } else {
          resp.render("match", {thisMatch: results});
        }
      }
    });
  });


 // -- New Player
app.route("/new-player/submit")
  .get(function (req, resp){
    if(req.isAuthenticated()){
      resp.render("new-player");
    } else{
      resp.redirect("/login");
    }
  })
  .post(function (req, resp){
    console.log(req.body.newName);
    console.log(req.body.newAlias);
    console.log(req.body.newEmail);
    const newPlayerName = req.body.newName;
    const newPlayerAlias = req.body.newAlias;
    const newPlayerEmail = req.body.newEmail;
    const newPlayer = new Player(
      {
        playerName: newPlayerName,
        playerEmail: newPlayerEmail
      });
      console.log(newPlayer);

    Player.findOne({playerName: newPlayerName}, function(err, player){
      if(err){
        console.log(err);
      }else{
        if(player){
          console.log("That player already exists");
          resp.redirect("/");
        } else{
            console.log(newPlayer);
            newPlayer.playerAliases.push(newPlayerAlias);
            newPlayer.save();
            resp.render("player", {playerName: newPlayer.playerName, thisPlayer: newPlayer});
        }
      }
    });

  });


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
