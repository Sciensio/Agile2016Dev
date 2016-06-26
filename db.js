var pg = require('pg');
var Q = require("q");
const _ = require('lodash');
const Script = require('smooch-bot').Script;
var request = require("request");
var client = new pg.Client();

const scriptRules = require('./script.json');

function createConnection() {
  var deferred = Q.defer();

  client.defaults.ssl = true;
  client.connect(process.env.DATABASE_URL, function(err){
    console.log("===create connection");
    if (err) {
        console.error(err);
        deferred.reject(err);
    }
    console.log("===db connection created");
    deferred.resolve();
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
                  deferred.reject(err);
              }
              else{
                  console.error(err);
                  deferred.reject(err);
              }
          } else {
              (console.log('=== userId ', bot.userId));
              (console.log('=== record ', JSON.stringify(result.rows[0])));
          }
          deferred.resolve(client);
      });
    });
  return deferred.promise;
}

module.exports = newUser;
