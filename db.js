var pg = require('pg');
var Q = require("q");
const _ = require('lodash');
const Script = require('smooch-bot').Script;
var request = require("request");

const scriptRules = require('./script.json');
var LOG_PREFIX = '[CONN] - ';

//undone add db connection pooling

function createConnection() {
  var deferred = Q.defer();

  pg.defaults.ssl = true;
  var connection = pg.connect(process.env.DATABASE_URL, function(err,result){
  });

  connection.connect(function (err){
    if (err) {
        console.error(err);
        deferred.reject(err);
    }

    console.log(LOG_PREFIX + "just copying code");
    deferred.resolve(connection);
  });
  return deferred.promise;
}

function newUser(bot) {
  var deferred = Q.defer();

  console.log("===creating connection");
  createConnection()
    .then (function(client) {
      client
      .query('insert into Attendees (SmoochId, Unsubscribed, UnsubscribedDate, CreatedDate) values ($1,$2, null, CURRENT_TIMESTAMP);', [bot.userId, 'f'],
        function(err,result) {
            if (err) {
                if (err.code == '23505'){
                    console.log("===user already exists: ", bot.userId);
                    //deferred.resolve(result);
                }
                else{
                    console.error(err);
                    deferred.reject(err);
                }
            } else {
                (console.log('=== userId ', bot.userId));
                deferred.resolve(result);
            }
        })
    });
  return deferred.promise;
}

module.exports = newUser;
