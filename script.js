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

const scriptRules = require('./script.json');

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = new Script({
    processing: {
        //prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },

    start: {
        receive: (bot) => {
            return bot.say('Hello!  I\'m A16, the Agile2016 EventBot Concierge.  To find out what I can help you with type MENU for options or KEY for Keywords.')
                .then(() => 'speak');
        }
    },

    speak: {
        receive: (bot, message) => {

            //console.log("- bot message ", message);

            //exit right away
//            if (message.mediaType) {
//              return bot.say("I'm sorry I don't know how to respond to media yet.  😳   Type MENU or KEY for a list of things I can help you with.")
//                .then(() => 'speak');
//            }

            let upperText = message.text.trim().toUpperCase();

            //This is in case a user uses the bots name in a request
            //console.log("before a16 search ", upperText.indexOf("A16"), upperText.length);
            if ((upperText.indexOf(process.env.BOT_NAME)  > -1)  && (upperText.length > 4)) {
              upperText = upperText.replace(process.env.BOT_NAME, "");
            }

            var msgLog = {
                smoochId: '',
                received: '',
                usermessage: '',
                role: '',
                message_id: '',
                sourcetype: '',
                receivedtime: '',
                responsemessage: '',
                responsetype: '',
                responsetime: ''
              };

            //create message log to pesist in db
            msgLog.smoochId = bot.userId;
            msgLog.received = message.received;
            msgLog.usermessage = message.text;
            msgLog.role = message.role;
            msgLog.message_id = message._id;
//TODO: add in timzone UTC
            console.log("new Date() = ",Date(dateString) +'+06');
            msgLog.receivedtime = new Date(dateString) +'+06';
            if (typeof message.message !== "undefined") {
              //postback
              msgLog.sourcetype = message.action.type;
            } else {
              // This is appUser - which means it is a message typed in by the user
              msgLog.sourcetype = message.source.type;
            }

            //SK_ACCESS is a heroku config var that has the list of user/platform
            //smoochids for users to send ad hoc push conversations
            if (upperText.substr(0,4) == '/SK ') {
              adhocMsg();
            }

            function adhocMsg() {
              var authUsers = process.env.SK_ACCESS;
              //For ad hoc messages - scheduled messages are done differently in checkItems
              //-1 indicates that a user is not authorized to send broadcast messages
              if (authUsers.indexOf(bot.userId) !== -1) {
                upperText = upperText.substr(0,3);
                newBot('adhoc',process.env.ADHOC_PREFIX + message.text.substr(4));
                console.log("- ad hoc msg: ",message.text," authUser:  ",authUsers);
                return jResponse();
              } else {
                upperText = "NO_SK";
              }
            }

            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        //console.log('- Special Case: CONNECT ME'); //turns off bot
                        return bot.setProp("silent", true);
                    case "/NOTIFY":
                        //console.log('- Special Case: /NOTIFY'); //turns off bot
                        bot.say("I have notified the Agile2016 human team that you have requested help. They usually respond in less than 5 minutes during conference hours. You are now in live support mode and when you are ready to chat with me again tap the button or type /A16. %[Return](postback:/A16)").then(() => 'speak');
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        //console.log('- Special Case: DISCONNECT'); //turns bot back on
                        return bot.setProp("silent", false);
                    case "/A16":
                        //console.log('- Special Case: /A16'); //turns bot back on
                        bot.say("A16 is back! I hope my human colleagues were able to help you.").then(() => 'speak');
                        return bot.setProp("silent", false);
                    default:
                        return Promise.resolve();
                }
            }

            function getSilent() {
                return bot.getProp("silent");
            }

            function apiMessage() {
              //prepare to send to API.ai
              console.log("in apiMessage");
              var promises = [];
              var source;
              var fulfillmentSpeech;
              var simplified;
              //To better pass to API.AI does not deal with '/' well
              if (upperText.match(/7\/2[456789]/g)) {
                upperText = upperText.replace("/", " ");
              }

              promises.push(nlp(upperText, bot.userId));

              Q.all(promises).then(function(responses) {
                //responses.forEach(function(response) {
                  console.log("- In Q.all");
                  //console.log("- Received result from API.ai",response);
                  source = response.result.source;
                  msgLog.responsemessage = response.result.fulfillment.speech;
                  msgLog.responsetime = new Date();

                  if (source === 'domains') {
                    console.log("apiMessage - domains");
                    //console.log("- In domains, switch default");
                    msgLog.responsetype = 'API.ai aomain';
                    logConv(msgLog);
                    return bot.say(msgLog.responsemessage).then(() => 'speak');
                  } else if (msgLog.responsemessage) {
                    //console.log("- In agent,",simplified);
                    upperText = response.result.action;
                    msgLog.responsetype = 'API.ai agent';
                    return jResponse();
                  } else {
                    msgLog.responsetype = 'Unknown';
                    logConv(msgLog);
                    return bot.say(`I'm sorry that is not something I know.  😳   Type MENU or KEY for a list of things I can help you with.`).then(() => 'speak');
                  }
                //});
              }, function(error) {
                  console.log("- Q.all error: ", error);
              });
            }

            function processMessage(isSilent){
                if (isSilent) {
                    return Promise.resolve("speak");
                }
                if (!_.has(scriptRules, upperText))
                {
                  //console.log("ProcessMessage no ", upperText);
                  apiMessage();
                } else {
                  console.log("processMessage has rule");
                  msgLog.responsetime = new Date;
                  msgLog.responsetype = 'JSON';
                  jResponse();
                }
            }

            function jResponse() {
                var response = scriptRules[upperText];
                var lines = response.split('\n');
                //console.log("=== msgLog  obj",msgLog);

                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log("- p line",line);
                        return wait(50).then(function() {
                            return bot.say(line);
                        });
                    });
                });
                logConv(msgLog);
                return p.then(() => 'speak');
            }

            return updateSilent()
                .then(getSilent)
                .then(processMessage);
        }
    }
});
