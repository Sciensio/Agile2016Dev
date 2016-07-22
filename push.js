'use strict';

//const _ = require('lodash');
//var pg = require('pg');
//var extend = require('util')._extend;

//postgress client connection
var pg = require('pg');
var Client = require('pg').Client;

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

pg.defaults.ssl = true;

  function schedConv(newBot, response) {
    var client = new Client(process.env.DATABASE_URL);
    client.connect();
    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299.999 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1, err1) {
          var query2 = client.query("SELECT DISTINCT smoochid FROM conversation;");
            console.log(">>>>>>> scheduled message", row1);
            query2.on('row',function(row2, err2) {
              console.log(">>>>>>> smoochid", row2);
                newBot.userId = row2.smoochid;
                //console.log('|| message: ',row1.message);
                return wait(50).then(function() {
                  console.log("<<<<<<< HERE in inner loop");
                  return newBot.say(process.env.SCHED_PREFIX + row1.message).then(console.log("|| Attendee ",newBot.userId," was sent message:", message),() => 'speak');
                });
                client.end();
                if(err2) {
                  return console.error("|| error is inner loop: ", err2);
                }
            });
//            if(err1) {
//              return console.error("|| error in outer loop: ", err1);
//            }
        });
    client.on('drain', client.end.bind(client));
  }

module.exports = {schedConv};
