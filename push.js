'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");

function pushMessage() {
  var deferred = Q.defer();

  console.log("===IN TEMP");

  smooch.conversations.sendMessage('a30fa820d0a0f0216fa26070', {
    text: 'Just put some vinegar on it',
    role: 'appMaker'
  })
  .then(() => {
    console.log("===did it send?");
    deferred1.resolve();
  });
  return deferred1.promise;
}


module.exports = pushMessage;
