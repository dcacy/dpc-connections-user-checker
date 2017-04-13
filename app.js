/**
 *
 *********************** IBM COPYRIGHT START  *********************************
// @copyright(disclaimer)
//
// Licensed Materials - Property of IBM
// 5724-L31
// (C) Copyright IBM Corp. 2017. All Rights Reserved.
//
// US Government Users Restricted Rights
// Use, duplication or disclosure restricted by GSA ADP Schedule
// Contract with IBM Corp.
//
// DISCLAIMER OF WARRANTIES :
//
// Permission is granted to copy and modify this Sample code, and to
// distribute modified versions provided that both the copyright
// notice, and this permission notice and warranty disclaimer appear
// in all copies and modified versions.
//
// THIS SAMPLE CODE IS LICENSED TO YOU "AS-IS".
// IBM  AND ITS SUPPLIERS AND LICENSORS  DISCLAIM
// ALL WARRANTIES, EITHER EXPRESS OR IMPLIED, IN SUCH SAMPLE CODE,
// INCLUDING THE WARRANTY OF NON-INFRINGEMENT AND THE IMPLIED WARRANTIES
// OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. IN NO EVENT
// WILL IBM OR ITS LICENSORS OR SUPPLIERS BE LIABLE FOR ANY DAMAGES ARISING
// OUT OF THE USE OF  OR INABILITY TO USE THE SAMPLE CODE, DISTRIBUTION OF
// THE SAMPLE CODE, OR COMBINATION OF THE SAMPLE CODE WITH ANY OTHER CODE.
// IN NO EVENT SHALL IBM OR ITS LICENSORS AND SUPPLIERS BE LIABLE FOR ANY
// LOST REVENUE, LOST PROFITS OR DATA, OR FOR DIRECT, INDIRECT, SPECIAL,
// CONSEQUENTIAL,INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER CAUSED AND REGARDLESS
// OF THE THEORY OF LIABILITY, EVEN IF IBM OR ITS LICENSORS OR SUPPLIERS
// HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
//
// @endCopyright
//*********************** IBM COPYRIGHT END  ***********************************
 *
 */


var express = require('express');
var cfenv = require('cfenv');
var app = express();


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


/*
* this call will get the list of Managers from Connections
* INPUT: n/a
* RETURNS: json containing the data from Connections
*/
app.get('/getMgrsInfo', function(req, res) {
  console.log('in getMgrsInfo');
  var json = managers.getMgrsData(properties, function(json) {
    managers.getReports(properties, json, function(json) {
      // console.log('in callback');
      res.setHeader('Content-Type','application/json');
      // res.end(JSON.stringify(json));
      // console.log('type is ', typeof json);
      res.end(json);
    });
  });
});


/**
* Given a list of Connections users, return their recent activity
*/
app.post('/getUserActivity', function(req, res) {
  console.log('in getUserActivity!!');
  if ( typeof req.body !== undefined && req.body.length > 0 ) {
    var json = peopleManaged.getUserActivity(properties, req.body, function(json) {
      if (typeof json.error !== undefined) {
      res.setHeader('Content-Type','application/json');
      res.end(JSON.stringify(json));
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type','application/json');
      res.end(JSON.stringify(json));
    }
    });
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
