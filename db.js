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
    })
    done();
  });
  return deferred.promise;
}

function logConversation(msgLog) {
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    client.query('insert into conversation (smoochId, received, usermessage, role, message_id, sourcetype, receivedtime, responsemessage, responsetype, responsetime) values ($1,$2, $3, $4, $5,$6, null, $7, $8, NULL);',
      [msgLog.smoochId, msgLog.received, msgLog.usermessage, msgLog.role, msgLog.message_id, msgLog.sourcetype, msgLog.responsemessage, msgLog.responsetype],
      function(err,result) {
        done();
          if (err) {
                  console.error(err);
                  deferred.reject(err);
              }
          else {
              (console.log('=== conversation logged '));
              deferred.resolve(result);
          }
    })
    done();
  });
  return deferred.promise;
}

module.exports = newUser;logConversation;
