'use strict';

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

            let upperText = message.text.trim().toUpperCase();

//TODO: don't try stateMachine; instead capture last text and if a search thing ie is search by speaker
//then the submit is speaker name and call speakersearch won't work for is session expires
//            if (msgLog.usermessage == 'SBSN') {
//                console.log("=== search string", upperText);
//                var msg = {};
//                findSession(upperText, msg);
//                return bot.setProp("silent", true);
//            }

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
//TODO prepend 'ALERT:  ' then message
            if (upperText.substr(0,4) == '/SK ') {
              if (authUsers.indexOf(bot.userId) !== -1) {
                upperText = upperText.substr(0,3);
                newBot('adhoc',message.text.substr(4));
                console.log("- ad hoc msg: ",message.text," authUser:  ",authUsers);
              } else {
                upperText = "NO_SK";
              }
            }


//TODO: There is a bug with /support and /a16 now.  /support does not present message and /a16 sometimes doubles the message
            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        console.log('- Special Case: CONNECT ME'); //turns off bot
                        return bot.setProp("silent", true);
                    case "/SUPPORT":
                        console.log('- Special Case: /SUPPORT'); //turns off bot
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        console.log('- Special Case: DISCONNECT'); //turns bot back on
                        return bot.setProp("silent", false);
                    case "/A16":
                        console.log('- Special Case: /A16'); //turns bot back on
                        //processMessage(false); TODO remove if bot works on /a16 test
                        return bot.setProp("silent", false);
                    default:
                        return Promise.resolve();
                }
            }

            function getSilent() {
                return bot.getProp("silent");
            }

            function processMessage(isSilent) {
                console.log("- processMessage ", upperText, "isSilent set to ",isSilent);
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
                          simplified = response.result.parameters.event;
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

                if (simplified == 'agile2017')
                    {
                        console.log("- In agent, agile2017");
                        msgLog.responsemessage = fulfillmentSpeech;
                        msgLog.responsetime = new Date;
                        msgLog.responsetype = 'API.AI Intent';
                        //return bot.say(fulfillmentSpeech).then(() => 'speak');
                        upperText = 'AGILE2017';
                    }

                if (!_.has(scriptRules, upperText)) {
                    console.log("- No match in Script.json ", upperText);
                    msgLog.responsemessage = upperText;
                    msgLog.responsetime = new Date();
                    msgLog.responsetype = 'No Match';
                    push.logConversation(msgLog);
                    return bot.say(`I'm sorry that is not something I know.  Type MENU or KEY for a list of things I can help you with.`).then(() => 'speak');
                }

                var response = scriptRules[upperText];
                var lines = response.split('\n');
                msgLog.responsemessage = response;
                msgLog.responsetime = new Date;
                msgLog.responsetype = 'JSON';
                console.log("=== msgLog  obj",msgLog);
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
                .then(wait(100))
                .then(console.log('--updateSilent step 1',getSilent()))
                .then(getSilent)
                //.then(function (upperText){
                //  if (upperText !== '/SUPPORT') {(getSilent)};
                //  console.log('************** /SUPPORT = true');
                //})
                .then(console.log('--updateSilent step 2'))
                .then(processMessage);
        }
    }
});
