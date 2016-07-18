'use strict';

//const _ = require('lodash');
//var pg = require('pg');
//var extend = require('util')._extend;

//postgress client connection
var pg = require('pg');
var Client = require('pg').Client;

pg.defaults.ssl = true;

  function schedConv(newBot, response) {
    var client = new Client(process.env.DATABASE_URL);
    client.connect();
    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          var query2 = client.query("SELECT DISTINCT smoochid FROM conversation;");
            query2.on('row',function(row2) {
                newBot.userId = row2.smoochid;
                //console.log('|| message: ',row1.message);
                return newBot.say(process.env.SCHED_PREFIX + row1.message).then(() => 'speak');
                client.end();
            });
        });
    client.on('drain', client.end.bind(client));
  }

module.exports = {schedConv};
