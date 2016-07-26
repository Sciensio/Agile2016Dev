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

  var msg = "";

  function schedConv(newBot, response) {

    var client = new Client(process.env.DATABASE_URL);
    client.connect();

    var query1 = client.query("SELECT message FROM batchmessage WHERE sendtime >= CURRENT_TIMESTAMP - INTERVAL '299.999 seconds' AND sendtime <= CURRENT_TIMESTAMP + INTERVAL '5 minutes' ORDER BY sendtime");
        query1.on('row', function(row1) {
          //var query2 = client.query("SELECT smoochid FROM conversation WHERE smoochid = 'a30fa820d0a0f0216fa26070' LIMIT 30;");
          var msg = row1.message;
          getUsers(newBot,client, msg);
        });
  }

  function getUsers(bot,client, msg) {
    var user = [];
    var query2 = client.query("select distinct smoochid from conversation;");
      query2.on('row',function(row2) {
        user.push(row2.smoochid);
      //  console.log(user);
      })
      query2.on('end', function(result) {
        return sayMsg(user,msg);
      });
      client.on('drain', client.end.bind(client));
  }

  function sayMsg(bot,users,msg) {
    var p = Promise.resolve();
    console.log(users);
    _.each(users, function(uid) {
      console.log("before p");
      p = p.then(function() {
        console.log("after p",uid);
          bot.userId = uid;
          console.log(bot);
          return wait(50).then(function(){
            return bot.say(msg);
        });
      });
    });

    return p.then(() => 'speak');
  }

module.exports = {schedConv};
