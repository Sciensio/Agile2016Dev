'use strict';

//const _ = require('lodash');
//var pg = require('pg');
//var extend = require('util')._extend;

//postgress client connection

var pg = require('pg');
var Client = require('pg').Client;
var botSpeak = require('./newBot_new').botSpeak;

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

pg.defaults.ssl = true;

  function schedConv() {
    var client = new Client(process.env.DATABASE_URL);
    client.connect();
    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299.999 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          //var query2 = client.query("SELECT DISTINCT smoochid FROM conversation;");
          var query2 = client.query("select smoochid from conversation WHERE smoochid = 'a30fa820d0a0f0216fa26070' LIMIT 20;");
            query2.on('row',function(row2) {
                //newBot.userId = row2.smoochid;
                //return newBot.say(process.env.SCHED_PREFIX + row1.message).then(() => 'speak');
                return fetch(botSpeak(row2.smoochid, row1.message)).then(response) => {
                  wait(120);
                };
                if(err) {
                  return console.error("|| ", err);
                }
            });
        });
      client.on('drain', client.end.bind(client));
  }

module.exports = {schedConv};
