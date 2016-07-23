'use strict';

//const _ = require('lodash');
//var pg = require('pg');
//var extend = require('util')._extend;

//postgress client connection

var pg = require('pg');
var Client = require('pg').Client;

pg.defaults.ssl = true;

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

  function schedConv(newBot, response) {
    var client = new Client(process.env.DATABASE_URL);
    client.connect();
    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299.999 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          //var query2 = client.query("SELECT DISTINCT smoochid FROM conversation;");
          var query2 = client.query("select smoochid from conversation WHERE smoochid = 'a30fa820d0a0f0216fa26070' LIMIT 30;");
          var i = 1;
            query2.on('row',function(row2) {
                newBot.userId = row2.smoochid;
                return wait(1000).then(function() {
                  return newBot.say(process.env.SCHED_PREFIX + row1.message + " " + i).then(console.log("|| ",i),() => 'speak')
                    //.then(console.log(i))
                    .then(i = i+1);
                  //.then(client.end());
                });
            });
        });
    return wait(10000).then(function() {
      client.on('drain', client.end.bind(client));
    });
  }

module.exports = {schedConv};