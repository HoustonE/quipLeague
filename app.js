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


// ****** REST ******

app.route("/")
  .get(function(req, resp){
    resp.render("home");
  });

  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 3000;
  }

  app.listen(port, function() {
    console.log("Server started successfully");
  });
