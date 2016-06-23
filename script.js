'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');

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
            return bot.say('Get started by saying BOT.')
                .then(() => 'speak');
        }
    },

    speak: {
        receive: (bot, message) => {
            console.log("===bot user ",bot.userId);
            let upperText = message.text.trim().toUpperCase();

            pg.defaults.ssl = true;
            pg.connect('postgres://grxniosfestwqm:GRwjT89SUooBetmQK9NbsSHl85@ec2-54-163-238-215.compute-1.amazonaws.com:5432/d89pfp7q3f1jj7', function(err,client){
                if (err) throw err;
                console.log('====Connected to postgres!!!!!'); 
                
                 client
                    .query('SELECT * FROM attendees;')
                    .on('row', function(row) {
                    console.log(JSON.stringify(row));
                 });
                            
            });
            
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
