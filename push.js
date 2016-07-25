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
          var query2 = client.query("SELECT smoochid FROM conversation WHERE smoochid = 'a30fa820d0a0f0216fa26070' LIMIT 30;");
          //var query2 = client.query("select distinct smoochid from conversation;");
          var rows2 = [];
            query2.on('row',function(row2) {
              rows2.push(row2);
              console.log("added row to array");
            });
          query2.on('end', function(result) {
            console.log("in end");
            var i = 0
            var arrayLength = rows2.length;
            for (var i = 0; i < arrayLength; i++) {
            newBot.userId = rows2[i];
            console.log("userId: ", newBot.userId);
            console.log("message: ", row1.message);
            newBot.say(process.env.SCHED_PREFIX + row1.message)
              .then(() => {
                'speak';
                console.log("actually sent: ", i);
              });
            }
          });
      });
      client.on('drain', client.end.bind(client));
  }


module.exports = {schedConv};
