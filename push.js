'use strict';

const _ = require('lodash');
var pg = require('pg');
var extend = require('util')._extend;

function pushConv(bot, message, response) {
  var newBot = bot;

  console.log("===creating pushconv connection ");
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    console.log("===bot");
    client
      .query('SELECT SmoochId FROM attendees WHERE unsubscribed = FALSE;')
        .on('row', function(row){
          console.log("===SmoochId ",row.smoochid);
          newBot.userId = row.smoochid;
          return newBot.say(message).then(console.log("===newBot.userId ",newBot.userId),() => 'speak');
        })
      done();
  });
}

module.exports = pushConv;
