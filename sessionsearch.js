'use strict';

const _ = require('lodash');
var pg = require('pg');
var Q = require("q");
var request = require("request");

var extend = require('util')._extend;

function findSession(session, response) {
  var deferred = Q.defer();

  console.log("===creating sessionsearch connection ",session);
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client, done){
    client
      .query("SELECT * FROM session WHERE LOWER(sessionname) LIKE '%($1)%') values ($1);",
        [session],
        function(err,result) {
          done();
            if (err) {
              console.error(err);
              deferred.reject(err);
            } else {
              (console.log('=== search result:  ', result));
              deferred.resolve(result);
            }
        });
      });
}

module.exports = findSession;
