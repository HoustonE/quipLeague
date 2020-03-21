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
const _ = require("lodash");

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


const sessionScoreSchema = new mongoose.Schema({
  //_id: mongoose.Schema.Types.ObjectId,
  sessionId: Number,
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
  sessionScores: [sessionScoreSchema]
});

const Player = new mongoose.model("Player", playerSchema);

// // test player
// const testPlayer = new Player({
//   playerName: "Real Dingus",
//   playerAliases: "evenanotherDingus",
//   sessionScores: []
// });
//
// console.log(testPlayer);
//
// //Test SessionSore
// const newSessionScore = new SessionScore({
//   sessionId: 2,
//   //playerId: playerSchema,
//   gameType: "Quiplash",
//   score: 3111,
//   position: 2
// });
//
// console.log(newSessionScore);
// // newSessionScore.save();
//
// Player.findOne({playerName: testPlayer.playerName}, function(err, foundPlayer) {
//   if (err) {
//     console.log(err);
//   } else {
//     if (!foundPlayer) {
//       testPlayer.sessionScores.push(newSessionScore);
//       testPlayer.save();
//     } else {
//       console.log("player found: " + foundPlayer);
//       const newAlias = testPlayer.playerAliases[0];
//       console.log(newAlias);
//       if (foundPlayer.playerAliases.includes(newAlias) === false) {
//         foundPlayer.playerAliases.push(newAlias);
//         foundPlayer.save();
//       }
//       foundPlayer.sessionScores.push(newSessionScore);
//       foundPlayer.save();
//     }
//   }
// });

// ****** REST ******
// -- Home
app.route("/")
  .get(function(req, resp) {
    Player.aggregate([{$unwind: "$sessionScores"}, {$unwind: "$playerAliases"},
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

    // Player.find({}).sort({totalScore: 'desc'}).exec(function(err, foundUsers){
    //   if(err){
    //     console.log(err);
    //   } else {
    //     resp.render("home", {leaderboard: foundUsers});
    //   }
    // });
  });

// -- Player
app.route("/:playerName")
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
            resp.render("player", {playerName: thisPlayerName, thisPlayer: foundPlayer});
          }
        }
      }
    );
  });



app.route("/submit")
  .get(function(req, resp) {
    resp.render("submit");
  });


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
