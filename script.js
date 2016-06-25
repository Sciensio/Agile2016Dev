'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");
var db = require("./db");

const scriptRules = require('./script.json');


function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

//move to separeate file
var promises = [];
function nlp(query,sessionId){
	var deferred = Q.defer();
	var options = {
		"method" : "POST",
		"url" : "https://api.api.ai/v1/query?v=20150910",
		"json" : {
			"query" : query,
			"lang" : "en",
			"sessionId" : sessionId
		},
		"headers" : {
			"Authorization" : "Bearer " + process.env.API_AI_TOKEN,
			"Content-Type" : "application/json"
		}
	};

	console.log("===nlp");
	console.log("===query: ",query);
	console.log("===sessionId",sessionId);
	request(options,function(err,response,body){
		if(err){
			console.log("===nlp failed because: ",err.message);
			deferred.reject(err);
		}else{
			body.sessionId = sessionId;
			if(response.statusCode == 200){
				console.log("===nlp succeeded ");
				deferred.resolve(body);
			}else{
				deferred.reject(body);
			}
		}
	});
	return deferred.promise;
}


module.exports = new Script({
    processing: {
        //prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },

    start: {
        receive: (bot) => {
            return bot.say('Get started by saying BOT.')
                .then(() => 'speak');
        }
    },

    speak: {
        receive: (bot, message) => {
            console.log("===bot user ",bot.userId);
            let upperText = message.text.trim().toUpperCase();

            console.log("===before db");
            promises.push(db.createUser(bot));
            console.log("===after db");

            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
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

                var source;
                var fulfillmentSpeech;
                var simplified;
                promises.push(nlp(upperText, bot.userId));

                Q.all(promises)
                .then(function(responses) {
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
                    console.log("[webhook_post.js]", error);
                });
                //return next();

            }

            function respondMessage(source, fulfillmentSpeech, simplified)
            {
                console.log("source: ", source);
                console.log("fulfillmentSpeech: ", fulfillmentSpeech);
                console.log("simplified: ", simplified);
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
                    return bot.say(`So, I'm good at structured conversations but stickers, emoji and sentences still confuse me. Say 'more' to chat about something else.`).then(() => 'speak');
                }

                var response = scriptRules[upperText];
                var lines = response.split('\n');

                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log(line);
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
