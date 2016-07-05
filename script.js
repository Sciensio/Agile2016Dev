'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");
var newUser = require("./db");
var nlp = require("./nlp");
var pushConv = require("./push");

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
            console.log("===bot user ");
            console.log("===receive step 1",message);
            let upperText = message.text.trim().toUpperCase();


            //Undone - currently only creates new user
            //needs to create conversation record and update it throughout the prcoess
            console.log("===before db",bot);
            newUser(bot)
              .then (console.log("===after db"))


              //undone - test for userid and or message
              //look at stacking messages in DB and looking them up
              //write loop to go through the database of users to send each message
              //end conversation and do not send a response to the user that kicked things off
              //
              console.log("===before push",bot);
              pushConv(bot)
              //  .then (console.log("===after push ",bot))
              console.log("===after push ",bot)


            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        return bot.setProp("silent", true);
                    case "-SUPPORT":
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        return bot.setProp("silent", false);
                    case "-ACE":
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
                promises.push(nlp(message.text, bot.userId));

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
                        console.log("fulfillmentSpeech is: ", fulfillmentSpeech);
                        return bot.say(fulfillmentSpeech).then(() => 'speak');
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

                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log("=== p line",line);
                        return wait(50).then(function() {
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
