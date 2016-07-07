'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;
var pg = require('pg');
var Q = require("q");
var request = require("request");
var extend = require('util')._extend;

var Q = require("q");
var request = require("request");
//
function schedSessions(schedRequest){
	var deferred = Q.defer();
	var options = new prepRequest(schedRequest);
  request(options,function(err,response,body){
    if (err) {
      console.error(err);
    }
//    .then(() =>
//      pg.defaults.ssl = true;
//      pg.connect(process.env.DATABASE_URL, function(err, client, done){
//      client.query('insert into conversation (smoochid, received, usermessage, role, message_id, sourcetype, receivedtime, responsemessage, responsetype, responsetime) values ($1,$2, $3, $4, $5,$6, $7, $8, $9, $10);',
//        [msgLog.smoochId, msgLog.received, msgLog.usermessage, msgLog.role, msgLog.message_id, msgLog.sourcetype, msgLog.receivedtime, msgLog.responsemessage, msgLog.responsetype, msgLog.responsetime],
//        function(err,result) {
//          done();
//            if (err) {
//                    console.error(err);
//                    deferred.reject(err);
//                }
//            else {
                console.log('=== body:  ',body);
//                deferred.resolve(result);
//            }
//      })
//}))





      deferred.resolve(body);
	});
  return deferred.promise;
}

function prepRequest(schedRequest){
	switch(schedRequest){
		case "SessionCount":
			var options = {
				"method" : "POST",
				"url" : "https://agile2016.sched.org/api/session/count",
				"qs" : {
					"api_key" : process.env.SCHED_TOKEN
				},
				"headers" : {
					"User-Agent" : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36"
				}
			};
			break;
		case "SessionList":
			var options = {
				"method" : "POST",
				"url" : "https://agile2016.sched.org/api/session/export",
				"qs" : {
					"api_key" : process.env.SCHED_TOKEN,
					"format" : "json",
          "fields" : "active, name, event_start, event_end, venue, id, speakers",
          "strip_html" : "Y"
				},
				"headers" : {
					"User-Agent" : "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36"
				}
			};
			break;
		default:
			var options = '';
	}
	return options;
}

exports.schedSessions = schedSessions;
