'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");
var newUser = require("./db");
var logConversation = require("./conversation");
var nlp = require("./nlp");
var pushConv = require("./push");
var newBot_msg = require("./newBot");
//var findSession = require("./sessionsearch");

//var sched = require("./sched");

const scriptRules = require('./script.json');

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

//    s1: {
//      prompt: (bot) => bot.say('Type part of the session name?'),
//      receive: (bot, message) => {
//        const name = message.text;
//        return bot.setProp('name', name)
//            .then(() => bot.say(`Great! I'll call you ${name}
//Is that OK? %[Yes](postback:yes) %[No](postback:no)`))
//            .then(() => 'speak');
//      }
//    },

//    chris: {
//      receive: (bot, message) => {
//        return bot.getProp('name')
//          .then((name) => bot.say('That is all!'))
//          .then(() => 'speak');
//      }
//    },

    speak: {
        receive: (bot, message) => {

            console.log("===bot message ", message);

            let upperText = message.text.trim().toUpperCase();

//            if (upperText == 'S1') {
//              return bot.getProp('name')
//              .then(() => 's1');
//            }

console.log("before loading msgLog ", message.message.source.type);
            msgLog.smoochId = bot.userId;
            msgLog.received = message.received;
            msgLog.usermessage = message.text;
            msgLog.role = message.role;
            msgLog.message_id = message._id;
            //if (msgLog.smoochId = )

            switch (typeof message.message === "undefined") {
              case false:
                  console.log("!!!! appUser = T, message.role", message.authorId);
//                  msgLog.sourcetype = message.action.type;
                break;
              default:
                console.log("!!!! appMaker = T, message.role", message.message);
//                msgLog.sourcetype = message.source.type;
                break;
            }
//
            msgLog.receivedtime = new Date();

            //sched.schedSessions('SessionList');

            //This is the control list of smoochId that can send broadcast messages
            var authUsers = ['a30fa820d0a0f0216fa26070'];

            newUser(bot)

            //For ad hoc messages - scheduled messages are done differently in checkItems
            if (authUsers.indexOf(bot.userId) !== -1) {
              if (upperText.substr(0,4) == '/SK ') {
                upperText = upperText.substr(0,3);
                newBot_msg(message.text.substr(4));
                console.log("****after push msg:  ",message.text," authUser:  ",authUsers);
              }
            }

            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        return bot.setProp("silent", true);
                    case "/SUPPORT":
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        return bot.setProp("silent", false);
                    case "/A16":
                        console.log("*** ",upperText," ***");
                        processMessage(false);
                        return bot.setProp("silent", false);
                    default:
                        return Promise.resolve();
                }
            }

            function getSilent() {
                return bot.getProp("silent");
            }

            function processMessage(isSilent) {
                if (isSilent) {
                    return Promise.resolve("speak");
                }

                var promises = [];
                var source;
                var fulfillmentSpeech;
                var simplified;
                promises.push(nlp(upperText, bot.userId));

                Q.all(promises).then(function(responses) {
                    // response is the JSON from API.ai
                    responses.forEach(function(response) {
                        console.log("===in Q.all");
                        console.log("===received result from API.ai",response);
                        source = response.result.source;
                        if (source && source !== 'agent')
                        {
                            fulfillmentSpeech = response.result.fulfillment.speech;
                            simplified = response.result.parameters.simplified;
                        }
                        console.log("source: ", source);
                        console.log("fulfillmentSpeech: ", fulfillmentSpeech);
                        console.log("simplified: ", simplified);

                        respondMessage(source, fulfillmentSpeech, simplified);
                    });
                }, function(error) {
                    console.log("===Q all error ", error);
                });
            }

            function respondMessage(source, fulfillmentSpeech, simplified)
            {
                console.log("source: ", source);
                console.log("fulfillmentSpeech: ", fulfillmentSpeech);
                console.log("simplified: ", simplified);
                console.log("===receive step 3",upperText);

              if (source != 'agent')
                {
                    console.log("===source is ", source);
                    if (fulfillmentSpeech)
                    {
                      switch (simplified) {
                        case "hello":
                          console.log("===in hello");
                          upperText = simplified.trim().toUpperCase();
                          break;
                        case "do you know":
                        case "can you help":
                        case "do you have":
                        case "how does this app work":
                        case "how much time do you need":
                        case "how to open you":
                        case "what can you talk about":
                        case "what do you know":
                          console.log("===in what do you know");
                          upperText = 'KNOW';
                          break;
                        case "what do you do":
                        case "how do you know":
                        case "job":
                          console.log("===in what do do");
                          upperText = "JOB";
                          break;
                        case "do you know me":
                        case "do you remember me":
                          console.log("===do you know me");
                          upperText = "ME";
                          break;
                        case "who named you":
                        console.log("===NAME");
                          upperText = "NAME";
                          break;
                        case "can you hear me":
                        case "can you speak":
                        case "change your":
                        case "hurry":
                        case "talk faster":
                        case "do you drink":
                        case "do you eat":
                          console.log("===set to NULL and question");
                          upperText = "";
                          break;
                        default:
                          console.log("===in switch default");
                          msgLog.responsemessage = fulfillmentSpeech;
                          msgLog.responsetime = new Date;
                          msgLog.responsetype = 'API.AI';
                          return bot.say(fulfillmentSpeech).then(() => 'speak');
                      }
                    }
                    else if (simplified)
                    {
                        console.log("simplified is: ", simplified);
                        upperText = simplified.toUpperCase();
                    }
                }

                console.log("===finished switch, upperText now:",upperText);

                if (!_.has(scriptRules, upperText)) {
                    console.log("===no rule", upperText);
                    return bot.say(`I'm sorry that is not something I know.  Type MENU or KEY for a list of things I can help you with.`).then(() => 'speak');
                }

                var response = scriptRules[upperText];
                var lines = response.split('\n');
                msgLog.responsemessage = response;
                msgLog.responsetime = new Date;
                msgLog.responsetype = 'JSON';
                console.log("=== msgLog  obj",msgLog);
                logConversation(msgLog);

                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log("=== p line",line);
                        return wait(5).then(function() {
                            return bot.say(line);
                        });
                    });
                });
                return p.then(() => 'speak');
            }

            return updateSilent()
                .then(getSilent)
                .then(processMessage);
        }
    }
});
