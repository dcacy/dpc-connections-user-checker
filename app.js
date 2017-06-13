
var express = require('express');
var cfenv = require('cfenv');
var app = express();
var rp = require('request-promise');

var url = require('url');
var bodyParser = require('body-parser');
app.use(bodyParser.json());

var managers = require('./modules/managers');
var peopleManaged = require('./modules/peopleManaged');

var appEnv = cfenv.getAppEnv();

// read parameters from a properties file
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./connections.properties');
console.log('properties are ', properties);




/**
 * get the list of Managers from Connections 
 * @params n/a 
 * @returns json containing the data from Connections 
 *  
*/ 
app.get('/getMgrsInfo', function(req, res) {   
	console.log('in getMgrsInfo');   
	managers.getMgrsInfo(properties)
	.then( (json) => {
//		console.log(json);
		managers.getReports(properties, json)
		.then( (result) => {
			res.json(result);
		})
		.catch( (error) => {
			res.status(500).json("error",error);
		})
	});
//	var json = managers.getMgrsInfo(properties, function(json) {
//		managers.getReports(properties, json, function(json) {
//			res.setHeader('Content-Type','application/json');       
//			res.end(json);     
//			});   
//	}); 
});
	

/**
* Given a list of Connections users, return their recent activity
*/
app.post('/getUserActivity', function(req, res) {
  if ( typeof req.body !== undefined && req.body.length > 0 ) {
  	peopleManaged.getUserActivity(properties, req.body)
  	.then( (result) => {
  		if (typeof result.error !== undefined) {
//	      res.setHeader('Content-Type','application/json');
	      res.json(result);
	    } else {
//	      res.statusCode = 500;
//	      res.setHeader('Content-Type','application/json');
//	      res.end(JSON.stringify(json));
	    	res.status(500).json(json);
	    }
  	})
  	.catch( (error) => {
      res.status(500).json(error);
  	});
//    var json = peopleManaged.getUserActivity(properties, req.body, function(json) {
//      if (typeof json.error !== undefined) {
//	      res.setHeader('Content-Type','application/json');
//	      res.end(JSON.stringify(json));
//	    } else {
////	      res.statusCode = 500;
////	      res.setHeader('Content-Type','application/json');
////	      res.end(JSON.stringify(json));
//	    	res.status(500).json(json);
//	    }
//    });
  } else {
    res.setHeader('Content-Type','application/json');
    res.statusCode = 400;
    res.end('No data passed to /getUserActivity');
  }
});

app.use(express.static(__dirname + '/public'));

// app.listen(process.env.PORT || 3001);
app.listen(appEnv.port || 3001, '0.0.0.0', function() {
  console.log('server starting on ', appEnv.url);
});
