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
          var p = Promise.resolve();
            query2.on('row',function(row2) {
              rows2.push(row2);
            });
            query2.on('end', function(result) {
              console.log("in on end");
                var msg = process.env.SCHED_PREFIX + row1.message;
                console.log("message is: ", msg);
                var i = 0;
                var arrayLength = rows2.length;
                for (var i = 0; i < arrayLength; i++) {
                  p = p.then(function() {
                    newBot.userId = rows2.[1];
                    console.log('newBot.userId: ', newBot.userId);
                    return wait(50).then(function() {
                      console.log("in ");
                      return bot.say(msg);
                    });
                  });
                return p.then(() => 'speak');
                }
              });
            });
      client.on('drain', client.end.bind(client));
  }

module.exports = {schedConv};
