'use strict';

const _ = require('lodash');
//const Script = require('smooch-bot').Script;
var pg = require('pg');
//var Q = require("q");
//var request = require("request");
var extend = require('util')._extend;

function pushConv(bot, message, response) {
  var deferred = Q.defer();
  //var newBot = extend({}, bot);
  var newBot = bot;

  console.log("===creating pushconv connection ");
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    console.log("===bot",newBot);
    client
      .query('SELECT SmoochId FROM attendees WHERE unsubscribed = FALSE;')
        .on('row', function(row){
          console.log("===SmoochId ",row.smoochid);
          newBot.userId = row.smoochid;
          return newBot.say(message).then(console.log("===newBot.userId ",newBot.userId),() => 'speak');
        })
      done();
      //pg.end();
  });
  console.log("=== did bot change",bot);
}


module.exports = pushConv;
