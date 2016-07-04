'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");

function pushMessage(bot) {
  var deferred = Q.defer();
  var origUserId;
  var newUserID = "a30fa820d0a0f0216fa26070";

  console.log("===IN TEMP");
  origUserId = bot.userId;
  bot.userId = newUserID;
  return bot.say("fulfillmentSpeech")
    .then(
      bot.userId = origUserId,
      console.log("===revert to old bot.user.id",bot.userId),
      () => 'speak'
    );

}

function pushConv(bot, response) {
  var deferred = Q.defer();
  var origUserId;

  console.log("===creating pushconv connection");
  origUserId = bot.userId;
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    console.log("===bot",bot);
    client
      .query('SELECT SmoochId FROM attendees;')
        .on('row', function(row){
          console.log("===SmoochId ",row.smoochid);
          bot.userId = row.smoochid;
          return bot.say(bot.userId)
            .then(
              console.log("===bot.userId ",bot.userId),
              bot.userId = origUserId,
              () => 'speak'
            );
        })
  });
}


module.exports = pushConv;//pushMessage;
