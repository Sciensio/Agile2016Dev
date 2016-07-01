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
      bot.userId = origUserId
      console.log("===revert to old bot.user.id",bot.userId)
      () => 'speak'
    );

}


module.exports = pushMessage;
