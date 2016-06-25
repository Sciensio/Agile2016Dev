var pg = require('pg');
var Q = require("q");
var request = require("request");

const scriptRules = require('./script.json');


function createUser(bot) {

  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err,client){
      if (err) throw err;
      console.log('====Connected to postgres!!!!!');

      client
          .query('insert into Attendees (SmoochId, Unsubscribed, UnsubscribedDate, CreatedDate) values ($1,$2, null, CURRENT_TIMESTAMP);', [bot.userId, 'f'],
          function(err,result) {
              if (err) {
                  if (err.code == '23505'){
                      console.log("===user already exists: ", bot.userId);
                  }
                  else{
                      console.log("===Unknown error: ", err);
                  }
              } else {
                  console.log('=== userId ', bot.userId);
                  console.log('=== record ', JSON.stringify(result.rows[0]));
              }
          });
  });
}

module.exports = createUser;
