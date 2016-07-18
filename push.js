'use strict';

const _ = require('lodash');
var pg = require('pg');
var extend = require('util')._extend;

//postgress connection
var pg = require('pg');
var Client = require('pg').Client;

pg.defaults.ssl = true;

  function schedConv(newBot, response) {
    var client = new Client(process.env.DATABASE_URL);
    client.on('drain', client.end.bind(client));
    client.connect();
    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          var query2 = client.query("SELECT DISTINCT smoochid FROM conversation;");
            query2.on('row',function(row2) {
                newBot.userId = row2.smoochid;
                console.log('|| message: ',row1.message);
                return newBot.say(row1.message).then(console.log("|| Attendee ",row2.smoochid," received message"),() => 'speak');
                client.end();
            });
        });
  }

//  function adhocConv(newBot, message, response) {
//    pool.connect(function(err, client, release) {
//      if (err) {
//        console.error("pool error: ",err);
//      }
      //TODO: there is a mistake in this that needs to be fixed
//      var query = client.query('SELECT DISTINCT smoochid FROM conversation;');
//        release();
//        query.on('row', function(row){
//          newBot.userId = row.smoochid;
//          console.log("|| Sending ad hoc message toSmoochId ", row.smoochid);
//          return newBot.say(message).then(console.log("|| Attendee ",newBot.userId," was sent message:", message),() => 'speak');
//          if(err) {
//            return console.error("|| ", err);
//          }
//        });
//    });
//  }

module.exports = {schedConv};//adhocConv,
