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
    var mess = "";
    var uid = [];
    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299.999 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          mess = process.env.SCHED_PREFIX + row1.message
        });

        //var query2 = client.query("SELECT DISTINCT smoochid FROM conversation;");
    var query2 = client.query("select smoochid from conversation WHERE smoochid = 'a30fa820d0a0f0216fa26070' LIMIT 30;");
      query2.on('row',function(row2) {
                //console.log("before adding to array");
        //uid.push(row2.smoochid);
        newBot.userId = row2.smoochid;
        return newBot.say(mess + " " + i).then(console.log("|| ",i),() => 'speak')
                //console.log("after adding to array");
      });
        //    query2.on('end', function(result) {
                //fired once and only once, after the last row has been returned and after all 'row' events are emitted
                //in this example, the 'rows' array now contains an ordered set of all the rows which we received from postgres
        //        console.log(result.rowCount + ' rows were received');
      sendSched(newBot, uid, mess);
        //      })
        //});
      console.log(mess);
      client.on('drain', client.end.bind(client));

  }

  function sendSched (bot, uid, msg) {
    console.log("sendSched was called");
    var arrayLength = uid.length;
    console.log("arrayLength set", arrayLength);
    for (var i = 0; i < arrayLength; i++) {
        console.log(uid[i]);
        //bot.userId = uid[i];
        //bot.say(msg).then(console.log(msg),() => 'speak');
    }
  }

module.exports = {schedConv};
