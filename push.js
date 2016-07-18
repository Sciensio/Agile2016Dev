'use strict';

const _ = require('lodash');
var pg = require('pg');
var extend = require('util')._extend;

//postgress connection
var pg = require('pg');
var Pool = require('pg').Pool;

pg.defaults.ssl = true;

if (typeof pool === 'undefined') {
  var pool = new Pool ({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    max: process.env.DB_CONNECTION_LIMIT,
    idleTimeoutMillis: 1000
  });
  console.log("+++++++++++++++++++++++ pool does not exist");
} else {
  console.log("----------------------- pool does exist");
}



pool.on('error', function(e, client) {
    console.log('|| Error in DB pool: ',e );
});

  function schedConv(newBot, response) {
    //console.log("< push.sched");
    pool.connect(function(err, client, release) {
      //console.log("pool connected");
      var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          var query2 = client.query("SELECT DISTINCT smoochid FROM conversation;");
            query2.on('row',function(row2) {
                release();
                newBot.userId = row2.smoochid;
                console.log('|| message: ',row1.message);
                return newBot.say(row1.message).then(console.log("|| Attendee ",row2.smoochid," received message"),() => 'speak');
            })
        });
      });
  }

  function adhocConv(newBot, message, response) {
    pool.connect(function(err, client, release) {
      if (err) {
        console.error("pool error: ",err);
      }
      var query = client.query('SELECT DISTINCT smoochid FROM conversation;');
        release();
        query.on('row', function(row){
          newBot.userId = row.smoochid;
          console.log("|| Sending ad hoc message toSmoochId ", row.smoochid);
          return newBot.say(message).then(console.log("|| Attendee ",newBot.userId," was sent message:", message),() => 'speak');
          if(err) {
            return console.error("|| ", err);
          }
        });
    });
  }

  function logConversation(msgLog) {
    console.log("|| in db, msgLog",msgLog);
    pool.connect(function(err, client, release) {
      if (err) {
        console.error("pool error: ",err);
      }
      client.query('insert into conversation (smoochid, received, usermessage, role, message_id, sourcetype, receivedtime, responsemessage, responsetype, responsetime) values ($1,$2, $3, $4, $5,$6, $7, $8, $9, $10);',
        [msgLog.smoochId, msgLog.received, msgLog.usermessage, msgLog.role, msgLog.message_id, msgLog.sourcetype, msgLog.receivedtime, msgLog.responsemessage, msgLog.responsetype, msgLog.responsetime]);
      release();
    });
  }

module.exports = {adhocConv, schedConv, logConversation};
