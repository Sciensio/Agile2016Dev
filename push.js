'use strict';

//const _ = require('lodash');
//var pg = require('pg');
//var extend = require('util')._extend;

//postgress client connection

var pg = require('pg');
var Client = require('pg').Client;
const _ = require('lodash');


pg.defaults.ssl = true;

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

  function schedConv(newBot, response) {
    var msg = "";
    var user = [];
    var client = new Client(process.env.DATABASE_URL);
    client.connect();
    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299.999 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          //var query2 = client.query("SELECT smoochid FROM conversation WHERE smoochid = 'a30fa820d0a0f0216fa26070' LIMIT 30;");
          var msg = row1.message;
        });

    var query2 = client.query("select distinct smoochid from conversation;");
      query2.on('row',function(row2) {
      user.push(row2);
      });
      client.on('drain', client.end.bind(client));

    _.each(user, function(uid) {
      p = p.then(function() {
        return wait(50).then(function(){
          bot.userId = uid;
          return bot.say(msg);
        });
      });
    });
    return p.then(() => 'speak');
  }


module.exports = {schedConv};
