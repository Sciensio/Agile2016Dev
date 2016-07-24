'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");
var nlp = require("./nlp");
var newBot = require("./newBot");
var push = require("./push");
var logConv = require("./log").logConversation;
//var findSession = require("./sessionsearch");

//bot stuff
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
const userId = 'a30fa820d0a0f0216fa26070';

var newBot = new SmoochApiBot({
    name,
    avatarUrl,
    lock,
    store,
    userId
});

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


module.exports = new msgBot({

    speak: {

      receive: (userId, message) => {

        console.log("provisioning bot");

        newBot.userId = userId
        console.log("botSpeak");
        return newBot.say(process.env.SCHED_PREFIX + message).then(() => 'speak');

      }

    }
  });
