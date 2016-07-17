'use strict';

//TODO: Load testing - look for one that is scriptable
//TODO: image hjandling
//TODO: emoji handling
//TODO: sentiment analysis
//TODO: JSON to global data resource
//TODO: better process or API Agent responses
//TODO: Fix Sched notice on SMS
//TODO: Demo ad hoc, sched notifications
//TODO: Add unsubscribe
//TODO: data collection
//TODO: find out why _ dont work any more


const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");
var nlp = require("./nlp");
var newBot = require("./newBot");
var push = require("./push");
//var findSession = require("./sessionsearch");

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

  var know = [
      "do you know",
      "can you help",
      "do you have",
      "how does this app work",
      "how much time do you need",
      "how to open you",
      "what can you talk about",
      "what do you know"
    ];

  var job = [
    "what do you do",
    "how do you know",
    "job"
  ];

  var me = [
    "do you know me",
    "do you remember me"
  ];

  var name = [
    "who named you"
  ];

  var noanswer = [
    "can you hear me",
    "can you speak",
    "change your",
    "hurry",
    "talk faster",
    "do you drink",
    "do you eat"
  ];

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

            console.log("- bot message ", message);
            //If sent a thumbs up answer in kind
            var isMediaMessage = message.mediaType ? true : false;
            var questmark = (message.text === '?') ? true : false;

            let upperText = message.text.trim().toUpperCase();

            msgLog.smoochId = bot.userId;
            msgLog.received = message.received;
            msgLog.usermessage = message.text;
            msgLog.role = message.role;
            msgLog.message_id = message._id;
            msgLog.receivedtime = new Date();
            //this mess is my way around the fact that smooch completely
            //changes the structure of the message obj if it is a postback vs user entered text
            //console.log("===message.message",message.message);
            //switch to the inverse should be faster because it does not have to traverse the whole prototype chain
            switch (typeof message.message !== "undefined") {
              case true:
                  //This is appMaker - which means it is a postback
                  msgLog.sourcetype = message.action.type;
                break;
              default:
                // This is appUser - which means it is a message typed in by the user
                  msgLog.sourcetype = message.source.type;
                break;
            }

            //SK_ACCESS is a heroku config var that has the list of user/devices
            //smoochids for auth users to send ad hoc push conversations
            var authUsers = process.env.SK_ACCESS;
            //For ad hoc messages - scheduled messages are done differently in checkItems
            //-1 indicates that a user is not authorized to send broadcast messages
            if (upperText.substr(0,4) == '/SK ') {
              if (authUsers.indexOf(bot.userId) !== -1) {
                upperText = upperText.substr(0,3);
                newBot('adhoc',"ALERT: " + message.text.substr(4));
                //console.log("- ad hoc msg: ",message.text," authUser:  ",authUsers);
              } else {
                upperText = "NO_SK";
              }
            }

            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        console.log('- Special Case: CONNECT ME'); //turns off bot
                        return bot.setProp("silent", true);
                    case "/NOTIFY":
                        console.log('- Special Case: /NOTIFY'); //turns off bot
                        bot.say("I have notified the Agile2016 human team that you have requested help. They usually respond in less than 5 minutes during conference hours. You are now in live support mode and when you are ready to chat with me again type /A16 or tap the button. %[Return to A16](postback:/A16)").then(() => 'speak');
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        console.log('- Special Case: DISCONNECT'); //turns bot back on
                        return bot.setProp("silent", false);
                    case "/A16":
                        console.log('- Special Case: /A16'); //turns bot back on
                        bot.say("A16 is back! I hope my human colleagues were able to help.").then(() => 'speak');
                        return bot.setProp("silent", false);
                    default:
                        return Promise.resolve();
                }
            }

            function getSilent() {
                return bot.getProp("silent");
            }

            function processMessage(isSilent) {
                //console.log("- processMessage ", upperText, "isSilent set to ",isSilent);
                if (isSilent) {
                    return Promise.resolve("speak");
                }
                var promises = [];
                var source;
                var fulfillmentSpeech;
                var simplified;

                //if((upperText.indexOf("/") + upperText.indexOf("-")) > -1)  &&  {
                if (upperText === ("7/24" || "7/25" || "7/26" || "7/27" || "7/28" || "7/29" )) {
                  upperText = upperText.replace("/", " ");
                }

                //This is in case a user uses the bots name in a request
                console.log("before a16 search ", upperText.indexOf("A16"), upperText.length);
                if ((upperText.indexOf("A16")  > -1)  && (upperText.length > 3)) {
                  console.log("in a16 search");
                  upperText = upperText.replace("/A16", "");
                }

                promises.push(nlp(upperText, bot.userId));

                Q.all(promises).then(function(responses) {
                    // response is the JSON from API.ai
                    responses.forEach(function(response) {
                        console.log("- In Q.all");
                        console.log("- Received result from API.ai",response);
                        source = response.result.source;
                        if (source && source !== 'agent')
                        {
                            console.log("- Q all not agent");
                            fulfillmentSpeech = response.result.fulfillment.speech;
                            simplified = response.result.parameters.simplified;
                        } else if (response.result.fulfillment.speech && source == 'agent') {
                          console.log("- Source is agent ", response.result);
                          fulfillmentSpeech = response.result.fulfillment.speech;
                          //Is is done to capture if it is using an agent that we set up on API.ai
                          //API.ai sends agent back if !== domains; wish they had a 3rd state
                          simplified = response.result.action;
                        }
                        console.log("- Process meesage set source to: ", source);
                        console.log("- Process meesage set fulfillmentSpeech to: ", fulfillmentSpeech);
                        console.log("- Process meesage set simplified to: ", simplified);

                        respondMessage(source, fulfillmentSpeech, simplified);
                    });
                }, function(error) {
                    console.log("===Q all error ", error);
                });
            }

            function respondMessage(source, fulfillmentSpeech, simplified){
                //these are answers that we intercept because we do not like the domain answers
                //and it does not appear that we can customize these items

                //answer and return converstaion directly - API auto-answers
                //for exceptions answer with JSON file
                if (fulfillmentSpeech && source === 'domains')
                {
                  switch (true) {
                    case (know.indexOf(simplified) >- 1):
                      console.log("-In domains, what do you know");
                      upperText = 'KNOW';
                      break;
                    case (job.indexOf(simplified)>-1):
                      console.log("- In domains, what do you do");
                      upperText = "JOB";
                      break;
                    case (me.indexOf(simplified)>-1):
                      console.log("- In domains, do you know me");
                      upperText = "ME";
                      break;
                    case (name.indexOf(simplified)>-1):
                    console.log("- in domains, who named you");
                      upperText = "NAME";
                      break;
                    case (noanswer.indexOf(simplified)>-1):
                      console.log("- In domains, do you eat");
                      //in these cases we want to return 'not something I know about'
                      upperText = "";
                      break;
                    default:
                      console.log("- In domains, switch default");
                      //evening is one of our keywords and also an answer in the small.talk domain
                      //as a synonym for 'good evening' which we want to keep
                      if (upperText == "EVENING") {break;}
                      //else let the domain answer be sent
                      msgLog.responsemessage = fulfillmentSpeech;
                      msgLog.responsetime = new Date();
                      msgLog.responsetype = 'API.AI Domain';
                      push.logConversation(msgLog);
                      return bot.say(fulfillmentSpeech).then(() => 'speak');
                  }
                }

                //API Agent answer (we built in api) want to return answer but split lines and queue
                if (fulfillmentSpeech && source === 'agent')
                    {
                        console.log("- In agent,",simplified);
                        msgLog.responsemessage = fulfillmentSpeech;
                        msgLog.responsetime = new Date;
                        msgLog.responsetype = 'API.AI/json';
                        //return bot.say(fulfillmentSpeech).then(() => 'speak');
                        upperText = simplified;
                        //var response = fulfillmentSpeech;
                    }

                //if it was answered by API then don't test it
                if (typeof response === 'undefined') {
                  //no agent, not JSON rules
                  if (!_.has(scriptRules, upperText))
                  {
                      console.log("- No match in Script.json ", upperText);
                      msgLog.responsemessage = upperText;
                      msgLog.responsetime = new Date();
                      msgLog.responsetype = 'No Match';
                      push.logConversation(msgLog);
                      //TODO test for images and gif and treat those separately this is not working
                      //TODO check for text vs emoji and parrot back what user sent
                      if (isMediaMessage === true) {
                        return bot.say(`I'm sorry I don't know how to respond to media yet.  😳   Type MENU or KEY for a list of things I can help you with.`).then(() => 'speak');
                      } else {
                        return bot.say(`I'm sorry that is not something I know.  😳   Type MENU or KEY for a list of things I can help you with.`).then(() => 'speak');
                      }
                  }
                }

                //the if statement is for those answer that we still need the json file for
                //if (response) {} else {var response = scriptRules[upperText];}
                //console.log( require( "./config.json" ) );
                var response = scriptRules[upperText];
                var lines = response.split('\n');
                msgLog.responsemessage = response;
                msgLog.responsetime = new Date;
                msgLog.responsetype = 'JSON';
                //console.log("=== msgLog  obj",msgLog);
                push.logConversation(msgLog);

                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log("=== p line",line);
                        return wait(100).then(function() {
                            return bot.say(line);
                        });
                    });
                });
                return p.then(() => 'speak');
            }

            return updateSilent()
                .then(wait(500))
                .then(getSilent)
                .then(processMessage);
        }
    }
});
