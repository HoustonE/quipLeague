/**
Ethan Houston
Quiplash Score tracker
2020-03
**/

//jshint esversion:6


// ****** NPM Requirements ******

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

// ****** Mongoose ******
mongoose.connect('mongodb://localhost:27017/quipDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const playerSchema = new mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId,
  playerName: String,
  playerAliases: [String],
  totalScore: Number
});

const Player = new mongoose.model("Player", playerSchema);

const sessionSchema = new mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId,
  gameType: String,
  gameDate: Date,
  //  winner: playerSchema
});

const Session = new mongoose.model("Session", sessionSchema);

const sessionScoreSchema = new mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId,
  sessionId: sessionSchema,
  playerId: playerSchema,
  score: Number
  //position: Number
});

const SessionScore = new mongoose.model("SessionScore", sessionScoreSchema);

// // test player
// const testPlayer = new Player({
//   playerName: "Real Dingus",
//   playerAliases: "evenanotherDingus"
// });
//
// console.log(testPlayer);
//
// Player.findOne({
//   playerName: testPlayer.playerName
// }, function(err, foundPlayer) {
//   if (err) {
//     console.log(err);
//   } else {
//     if (!foundPlayer) {
//       testPlayer.save();
//     } else {
//       console.log("player found: " + foundPlayer);
//       const newAlias = testPlayer.playerAliases[0];
//       console.log(newAlias);
//       if (foundPlayer.playerAliases.includes(newAlias) === false) {
//         foundPlayer.playerAliases.push(newAlias);
//         foundPlayer.save();
//       }
//     }
//   }
// });
//
// // test Session
// const now = Date.now();
// // const winnerID = mongoose.Types.ObjectId('5e73af78656be9242c115713')
//
// const testSession = new Session({
//   gameType: "Quiplash",
//   gameDate: now,
// });
//
// console.log(testSession);
// testSession.save();
//
// //test SessionScore
// const newPlayer = new Player({
//   playerName: "Player withScore",
//   playerAliases: "gotPoints"
// });
//
// Player.findOne({
//   playerName: newPlayer.playerName
// }, function(err, foundPlayer) {
//   if (err) {
//     console.log(err);
//   } else {
//     if (!foundPlayer) {
//       newPlayer.save();
//     } else {
//       console.log("player found: " + foundPlayer);
//       const newAlias = newPlayer.playerAliases[0];
//       console.log(newAlias);
//       if (foundPlayer.playerAliases.includes(newAlias) === false) {
//         foundPlayer.playerAliases.push(newAlias);
//         foundPlayer.save();
//       }
//     }
//   }
// });
//
// const newSession = new Session({
//   gameType: "Quiplash",
//   gameDate: now,
// });
//
// newSession.save();
//
// const newSessionScore = new SessionScore({
//   sessionId: newSession,
//   playerId: newPlayer,
//   score: 1232
// });
//
// console.log(newSessionScore);
// newSessionScore.save();

// ****** REST ******

app.route("/")
  .get(function(req, resp) {
    Player.find({}).sort({totalScore: 'desc'}).exec(function(err, foundUsers){
      if(err){
        console.log(err);
      } else {
        resp.render("home", {leaderboard: foundUsers});
      }
    });
  });

app.route("/submit")
  .get(function(req, resp){
    resp.render("submit");
  });


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
