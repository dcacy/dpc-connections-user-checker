

var https = require('https');
var parseString = require('xml2js').parseString;
var rp = require('request-promise');

/*
* get the managers from Connections.
* Creates a simple JSON Array with manager name and email
*/
exports.getMgrsInfo = function(properties) {

	return new Promise( (resolve, reject) =>  { 
		
		var MANAGERS_URI = '/profiles/atom/search.do?isManager=Y&ps=100';
		var options = {
		    method: 'GET',
		    uri: 'https://' + properties.get('connections_host') + MANAGERS_URI,
		    "auth": {
		      "user": properties.get('connections_userid'),
		      "pass": properties.get('connections_password')
		  },
		  json: false // do not parse the result to JSON
		};
		rp(options)
		.then(function (resultXML) {
//			console.log('in then:', resultXML);
			var json = parseMgrsFeed(resultXML);
			resolve(json);
		})
		.catch( (error) => {
			console.log('error in getting Managers feed:', error);
			reject(error);
		});
	});

};

/**
* Create an array of managers
* @params {string} XML result of the Connections search for Managers
* @returns {object} JSON array containing the name and email of each manager
*/
function parseMgrsFeed(result) {
  console.log('in parseMgrsFeed ');
  var json = {};
  var managers = [];
  parseString(result, { explicitArray:false }, function(err, parsedXml) {
    if ( err === null ) {
      json = parsedXml.feed.entry;
      for (var i = 0; i < parsedXml.feed.entry.length; i++ ) {
        var manager = { name: parsedXml.feed.entry[i].title._, email: parsedXml.feed.entry[i].contributor.email};
        managers.push(manager);
      }
    } else {
    	console.log('error in parse!');
      // handle error condition in parse
    }
  });

  return managers;
}


exports.getReports = function(properties, managers) {
	
	return new Promise( (resolve, reject) => {
		
	  console.log('in getReports; this many managers:', managers.length);
	  var promises = [];
	  for ( var k = 0; k < managers.length; k++) {
	      promises.push(makePromise(properties, managers[k]));
	  }
	  Promise.all(promises).then(function(allData) { // this will run when all promises have returned
	   resolve(allData);
	  }, function(err) {
	    console.log('oops, an error:', err.statusCode, err.statusMessage);
	    var errMsg = {action: "get people managed", statusCode: err.statusCode, statusMessage: err.statusMessage};
	    reject(errMsg);
	  });
	});
};

function makePromise(properties, manager) {
  return new Promise(function(resolve, reject) {
    var options = {
      host: properties.get('connections_host'),
        port: 443,
        method: 'GET',
        path: '/profiles/atom/peopleManaged.do?email=' + encodeURI(manager.email),
        auth: properties.get('connections_userid') + ':' + properties.get('connections_password')
      };
      var request = https.request(options, function(response) {
          var data = "";
          response.on('data', function (chunk) {
              data += chunk;
          });
          response.on('end', function() {
            if ( response.statusCode === 200 ) {
              parseString(data, { explicitArray:true }, function(err, parsedXml) {
                if (err) {
                  console.log('error in parsing result: ', err);
                  reject({error:'error in parsing people managed of ' + manager.name});
                } else {
                  if ( parsedXml.feed.entry ) {
                    var reports = [];
                    for (var i = 0; i < parsedXml.feed.entry.length; i++) {
                      if ( manager.email !== parsedXml.feed.entry[i].contributor[0].email[0] )
                      {
                        var report =
                        {
                          name: parsedXml.feed.entry[i].contributor[0].name[0],
                          email: parsedXml.feed.entry[i].contributor[0].email[0],
                          userid: parsedXml.feed.entry[i].contributor[0]['snx:userid'][0]
                        };
                        reports.push(report);
                      }
                    }
                    manager.peopleManaged = reports;
                    manager.nbrOfEmployees = reports.length;
                  }
                  if ( !manager.nbrOfEmployees ) {
                    manager.nbrOfEmployees = 0;
                  }
                  resolve(manager);

                }
              });
            } else {
              reject(response);
            }
          });
      });
      request.on('error', function (e) {
          console.log("There is an error");
          reject(e);
      });
      request.end();
    });


}
