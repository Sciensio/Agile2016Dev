'use strict';

const _ = require('lodash');
var pg = require('pg');
var extend = require('util')._extend;

var pg = require('pg');
const smoochBot = require('smooch-bot');
const MemoryLock = smoochBot.MemoryLock;
const SmoochApiStore = smoochBot.SmoochApiStore;
const SmoochApiBot = smoochBot.SmoochApiBot;
const StateMachine = smoochBot.StateMachine;
const app = require('../app');
const script = require('../script');
const SmoochCore = require('smooch-core');

const jwt = require('../jwt');
const fs = require('fs');
var pushConv = require('../push');

const name = 'A16';
const avatarUrl = 'https://raw.githubusercontent.com/Sciensio/Agile2016Dev/master/img/agile-alliance-logo-bot.png';
const store = new SmoochApiStore({
    jwt
});
const lock = new MemoryLock();
const userId = 'a30fa820d0a0f0216fa26070';

var newBot = new SmoochApiBot({
    name,
    avatarUrl,
    lock,
    store,
    userId
});

function pushConv(message, response) {
//  var newBot = bot;

  console.log("===creating pushconv connection ");
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    console.log("===bot",newBot);
    client
      .query('SELECT SmoochId FROM attendees WHERE unsubscribed = FALSE;')
        .on('row', function(row){
          console.log("===SmoochId ",row.smoochid);
          newBot.userId = row.smoochid;
          return newBot.say(message).then(console.log("===newBot.userId ",newBot.userId),() => 'speak');
        })
      done();
  });
  console.log("=== did bot change",bot);
}

module.exports = pushConv;
