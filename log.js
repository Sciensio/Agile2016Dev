'use strict';

const _ = require('lodash');
var pg = require('pg');
var extend = require('util')._extend;

//postgress connection
var pg = require('pg');
var Pool = require('pg').Pool;

pg.defaults.ssl = true;
var pool = new Pool ({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  max: process.env.DB_CONNECTION_LIMIT,
  idleTimeoutMillis: 1000
});

pool.on('error', function(e, client) {
    console.log('|| Error in DB pool: ',e );
});

  function logConversation(msgLog) {
    pool.query('insert into conversation (smoochid, received, usermessage, role, message_id, sourcetype, receivedtime, responsemessage, responsetype, responsetime) values ($1,$2, $3, $4, $5,$6, $7, $8, $9, $10);',
      [msgLog.smoochId, msgLog.received, msgLog.usermessage, msgLog.role, msgLog.message_id, msgLog.sourcetype, msgLog.receivedtime, msgLog.responsemessage, msgLog.responsetype, msgLog.responsetime],
      function(err){
        if(err) console.log("!!!!!!!!!!!!!!! error in log ",err);
      }
    );
  }

module.exports = logConversation;
