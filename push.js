'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");

function pushMessage() {
  var deferred = Q.defer();

  console.log("===IN TEMP",bot);
}


module.exports = pushMessage;
