//'use strict';

//const _ = require('lodash');
//var pg = require('pg');
//var extend = require('util')._extend;

//postgress client connection

var pg = require('pg');
var Client = require('pg').Client;
var newBot = require('./newBot');

pg.defaults.ssl = true;

  function push() {
    return newBot.botSpeak('a30fa820d0a0f0216fa26070', "hello");
    var client = new Client(process.env.DATABASE_URL);
    client.connect();
    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299.999 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          //var query2 = client.query("SELECT DISTINCT smoochid FROM conversation;");
          var query2 = client.query("select distinct smoochid from conversation;");
            query2.on('row',function(row2) {
                //newBot.userId = row2.smoochid;
                //return newBot.say(process.env.SCHED_PREFIX + row1.message).then(() => 'speak');
                //return newBot.botSpeak(row2.smoochid, row1.message);
                //return newBot.botSpeak('a30fa820d0a0f0216fa26070', "hello");
                if(err) {
                  return console.error("|| ", err);
                }
            });
        });
      client.on('drain', client.end.bind(client));
  }

module.exports = push;
