'use strict';

const _ = require('lodash');
var pg = require('pg');
var extend = require('util')._extend;

function findSession(session, response) {
  //var newBot = bot;

  console.log("===creating sessionsearch connection ");
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    client
      .query('SELECT * FROM session WHERE LOWER(sessionname) like $session;'),
        [session],
        function(err,result) {
          done();
            if (err) {
              console.error(err);
              deferred.reject(err);
            } else {
              (console.log('=== userId ', result));
              deferred.resolve(result);
            }
        }
      });
}

module.exports = findSession;
