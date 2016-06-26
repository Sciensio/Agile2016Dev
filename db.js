var pg = require('pg');
var Q = require("q");
var request = require("request");

const scriptRules = require('./script.json');

function createConnection() {
  var deferred = Q.defer();
  pg.defaults.ssl = true;

  pg.connect(process.env.DATABASE_URL, function(err,client){
    console.log("===create connection");
    if (err) {
        console.console.error(err);
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
    .then (function(client) {
      client.query('insert into Attendees (SmoochId, Unsubscribed, UnsubscribedDate, CreatedDate) values ($1,$2, null, CURRENT_TIMESTAMP);', [bot.userId, 'f'],
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
          deferred.resolve(results);
      });
    })
    //.fail(function (err){
    //  console.log("error");
    //  console.error(JSON.stringify(err));
    //  deferred.reject(err);
    //});
  return deferred.promise;
}

module.exports = newUser;
