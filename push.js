'use strict';

const _ = require('lodash');
var pg = require('pg');
var extend = require('util')._extend;

//postgress connection
var pg = require('pg');
var Pool = require('pg').Pool;
var pool = new Pool ({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  max: 10,
  idleTimeoutMillis: 1000
});

pool.on('error', function(e, client) {
    console.log('|| Error in DB pool: ',e );
})

function schedConv(newBot, response) {
  pool.connect(function(err, client, release) {
  var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime > '07/12/2016' ORDER BY sendtime");
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
  var query = client.query('SELECT DISTINCT smoochid FROM conversation;');
    query.on('row', function(row){
      release();
      newBot.userId = row.smoochid;
      console.log("|| Sending ad hoc message toSmoochId ",row.smoochid);
      //return newBot.say(message).then(console.log("|| Attendee ",newBot.userId," was sent message:", message),() => 'speak');
    });
  });
}

module.exports = {adhocConv, schedConv}
