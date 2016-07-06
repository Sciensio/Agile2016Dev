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

    speakers: {
      prompt: (bot) => bot.say('What speaker are you searching for?'),
      receive: (bot, message) => {
        const name = message.text;
        return bot.setProp('name', name)
          .then(() => bot.say("I will search for ${name} is that OK? %[Yes](postback:hello) %[No](postback:hello)"))
          .then(() => 'finish');
      }
    },

    searchName {
      receive: (bot, message) => {
        .then => bot.say("That's all!")
        .then(() => 'finish');
      }
    },

    speak: {
        receive: (bot, message) => {
            console.log("===bot user ");
            console.log("===receive step 1",message);
            let upperText = message.text.trim().toUpperCase();

            if (message.text = 'speakers') {
              .then(() => 'speakers');
            }

            msgLog.smoochId = bot.userId;
            msgLog.received = message.received;
            msgLog.usermessage = message.text;
            msgLog.role = message.role;
            msgLog.message_id = message.message_id;
            msgLog.sourcetype = message.source.type;
            msgLog.receivedtime = new Date();

            var botUser = bot.userId;
            var authUsers = ['a30fa820d0a0f0216fa26070'];


            //Undone - currently only creates new user
            //needs to create conversation record and update it throughout the prcoess
            //console.log("===before db");
            newUser(bot)
            //  .then (console.log("===after db", bot.userId))


              //undone - test for userid and or message
              //look at stacking messages in DB and looking them up
              //end conversation and do not send a response to the user that kicked things off
              //
              if (authUsers.indexOf(bot.userId) !== -1) {
                if (message.text.substr(0,5) == '/msg ') {
                  upperText = upperText.substr(0,4);
                  pushConv(bot, message.text.substr(5));
                  console.log("****after push msg:  ",message.text);
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

            console.log("===receive step 2",upperText);

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
                        //console.log("===in Q.all");
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
                //return next();

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
                        case "what do you know":
                          console.log("===in what do you know");
                          upperText = simplified.trim().toUpperCase();
                          break;
                        case "can you talk":
                          console.log("===can you talk");
                          upperText = simplified.trim().toUpperCase();
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
                if (!_.has(scriptRules, upperText)) {
                    console.log("===no rule", upperText);
                    return bot.say(`I'm sorry that is not something I know.  Type MENU or KEY for a list of things I can help you with.`).then(() => 'speak');
                }

                console.log("===receive step 3",upperText);


                var response = scriptRules[upperText];
                var lines = response.split('\n');

                bot.userId = botUser;

                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log("=== p line",line);
                        return wait(5).then(function() {
                            msgLog.responsemessage = line;
                            //var senttime = new new Date( new Date().getTime() -6 * 3600 * 1000).toUTCString().replace( / GMT$/, "" );
                            msgLog.responsetime = new Date;
                            msgLog.responsetype = 'JSON';
                            console.log("=== msgLog  obj",msgLog);
                            logConversation(msgLog);
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
