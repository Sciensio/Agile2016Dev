var pg = require('pg');
const smoochBot = require('smooch-bot');
const MemoryLock = smoochBot.MemoryLock;
const SmoochApiStore = smoochBot.SmoochApiStore;
const SmoochApiBot = smoochBot.SmoochApiBot;
const StateMachine = smoochBot.StateMachine;
const app = require('./app');
const script = require('./script');
const SmoochCore = require('smooch-core');
var smoochUser = require('smooch-core').smooch

const jwt = require('./jwt');
const fs = require('fs');
var sched = require('./push');
var adhoc = require('./log');

const name = 'A16';
const avatarUrl = 'https://raw.githubusercontent.com/Sciensio/Agile2016Dev/master/img/agile-alliance-logo-bot.png';
const store = new SmoochApiStore({
    jwt
});
const lock = new MemoryLock();
const userId = process.env.STUB_ID;

var newBot = new SmoochApiBot({
    name,
    avatarUrl,
    lock,
    store,
    userId
});

function newBot_msg(type, message) {
  if (type === 'sched') {
    //console.log("> newBot, sched");
    return sched.schedConv(newBot);
  } else if (type === 'adhoc') {
    //console.log("> newbot, ad hoc");
    return adhoc.adhocConv(newBot, message);
  }
}

module.exports = newBot_msg;
