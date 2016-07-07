var Q = require("q");
var request = require("request");
//
function schedSessions(schedRequest){
	var deferred = Q.defer();
	console.log("===before option prep");
	var options = new prepRequest(schedRequest);
	console.log("===after option prep",options);
  request(options,function(err,response,body){
      deferred.resolve(body);
			console.log("===list count:",body);
	});
  return deferred.promise;
}

function prepRequest(schedRequest){
	console.log("===before switch");
	switch(schedRequest){
		case "SessionCount":
			console.log("===in case");
			var options = {
				"method" : "POST",
				"url" : "https://sciensiotestevent2016.sched.org/api/session/count",
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
				"url" : "https://sciensiotestevent2016.sched.org/api/session/list",
				"qs" : {
					"api_key" : process.env.SCHED_TOKEN,
					"format" : "json",
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
