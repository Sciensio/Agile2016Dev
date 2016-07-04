//#!/usr/bin/env node

var pg = require('pg');

pg.connect(process.env.DATABASE_URL, function(err,client,done) {
  var handleError = function(err) {
    if(!err) return false;
    done(client);
    next(err);
    return true;
  };

  client.query('SELECT * FROM attendees', function(err, result) {
    if(handleError(err, client, done)) return;

    if (result.rows.legnth > 0) {
      console.log("===task worked")
    }
    done();
    pg.end();
  });
});
