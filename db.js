var pg = require('pg');
var Q = require("q");
const _ = require('lodash');
const Script = require('smooch-bot').Script;
var request = require("request");

function newUser(bot, response) {
  var deferred = Q.defer();

  console.log("===creating connection");
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    client.query('insert into Attendees (SmoochId, Unsubscribed, UnsubscribedDate, CreatedDate) values ($1,$2, null, CURRENT_TIMESTAMP);',
      [bot.userId, 'f'],
      function(err,result) {
        done();
          if (err) {
              if (err.code == '23505'){
                  console.log("===user already exists: ", bot.userId);
                  deferred.resolve(result);
              }
              else{
                  console.error(err);
                  deferred.reject(err);
              }
          } else {
              (console.log('=== userId ', bot.userId));
              deferred.resolve(result);
          }
    });//codacy semi-colon issue not sure whre it is supposed to go
    done();
  });
  return deferred.promise;
}

module.exports = newUser;
