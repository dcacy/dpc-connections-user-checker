var https = require('https');
var dateMath = require('date-arithmetic');
var rp = require('request-promise');

function createDate() {
  var date = new Date();
  var newDate =  dateMath.subtract(new Date(), 30, 'day');
  return newDate.toISOString();
}

/**
 * 
 */
exports.getUserActivity = function(properties, peopleManaged) {
	
	console.log('in getUserActivity');
	return new Promise( (resolve, reject) => {
	  var promises = [];
	  for ( var i = 0; i < peopleManaged.length; i++) {
	      promises.push(makeGetUserActivityPromise(properties, peopleManaged[i]));
	  }
	  Promise.all(promises).then(function(allData) {
	    resolve(allData);
	    }, function(err) {
	      console.log('error! ', err.statusCode, err.statusMessage);
	      reject({error: 'Error in getting User Activity: code = ' + err.statusCode + ', message = ' + err.statusMessage});
	    }
	  );
	});
};

/**
 * Create a promise to get the user's recent activity
 * @param {object} properties hostname and credentials for Connections
 * @param {object} report the Connections user to query for recent activity
 * @returns {object} a promise which resolves to a JSON object of the user's activity
 */
function makeGetUserActivityPromise(properties, report) {

	console.log('in makegetUserActivityPromise with ', report.email);
	return new Promise(function(resolve, reject) {
    
		var dateToUse = createDate();
		var ACTIVITY_URI = '/connections/opensocial/basic/rest/activitystreams/@public/@all?FilterBy=involved&filterOp=equals&updatedSince=' + dateToUse + '&filterValue=' + report.userid;

    var options = {
		    method: 'GET',
		    uri: 'https://' + properties.get('connections_host') + ACTIVITY_URI,
		    "auth": {
		      "user": properties.get('connections_userid'),
		      "pass": properties.get('connections_password')
		  },
		  json: true // parse the result to JSON
		};
		rp(options)
		.then( (json) => {
			var activity = [];
      var userInfo = {name: report.name};
      for ( var i = 0; i < json.list.length; i++ ) {
        if ( report.name === json.list[i].actor.displayName ) {
          var details = {
            name : json.list[i].connections.containerName,
            title: json.list[i].connections.plainTitle,
            author: json.list[i].actor.displayName,
            publishedDate: json.list[i].published,
            shortTitle: json.list[i].connections.shortTitle,
            itemUrl: json.list[i].openSocial.embed.context.itemUrl
          };
          activity.push(details);
        }
      }
      userInfo.activity = activity;
      resolve(userInfo);
		})
		.catch( (error) => {
			console.log('error in getting user activity for ', report, '. Status Code = ', error.statusCode, ' and error = ', error.error);
			reject(error);
		});
	});
}
