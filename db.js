var pg = require('pg');
var Q = require("q");
const _ = require('lodash');
const Script = require('smooch-bot').Script;
var request = require("request");

//const scriptRules = require('./script.json');
//var LOG_PREFIX = '[CONN] - ';

//undone add db connection pooling

function createConnection() {
  var deferred = Q.defer();

  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err,result){
    if (err) {
        console.error(err);
        deferred.reject(err);
    }
    console.log("===db connection created");
    deferred.resolve(pg);
  });
  return deferred.promise;
}

function newUser(bot) {
  var deferred = Q.defer();

  console.log("===creating connection");
  createConnection()
    .then (function(pg) {
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
    //})
    //.fail(function(err){
    //    console.error("===bogus error here ",err.code);
        //deferred.reject(err);
    });
  return deferred.promise;
}

module.exports = newUser;
