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

var https = require('https');
var parseString = require('xml2js').parseString;


/*
* get the managers from Connections.
* Creates a simple JSON Array with manager name and email
*/
exports.getMgrsData = function(properties, callback) {
  var connections_path = '/profiles/atom/search.do?isManager=Y&ps=100';
  var options = {
    host: properties.get('connections_host'),
    port: 443,
    method: 'GET',
    path: connections_path,
    auth: properties.get('connections_userid') + ':' + properties.get('connections_password')
  };
  var result = '';
  var json = {};
  var request = https.request(options, function(response) {
    try {
      response.on('data', function(chunk) {
        result += chunk;
      });
      response.on('end', function() {
        json = parseMgrsFeed(result);
        callback(json);
      });
    } catch (e) { console.log(e); }
  })
  .on('error', function(e) {
    console.log ("got error calling Connections: " + e);
    console.log(JSON.stringify(e));
    console.log('code is ', e.code);
    json = e;
    callback(json);
  });
  request.end();
  return json;

};

/*
* Create an array of managers
*/
function parseMgrsFeed(result) {
  console.log('in parseMgrsFeed ');
  var json = {};
  var managers = [];
  parseString(result, { explicitArray:false }, function(err, parsedXml) {
    if ( err === null ) {
      console.log('this many mgrs:', parsedXml.feed.entry.length);
      json = parsedXml.feed.entry;
      for (var i = 0; i < parsedXml.feed.entry.length; i++ ) {
        var manager = { name: parsedXml.feed.entry[i].title._, email: parsedXml.feed.entry[i].contributor.email};
        managers.push(manager);
      }
    } else {
      // handle error condition in parse
    }
  });

  return managers;
}


exports.getReports = function(properties, managers, callback) {
  console.log('in getReports');
  var promises = [];
  for ( var k = 0; k < managers.length; k++) {
      promises.push(makePromise(properties, managers[k]));
  }
  Promise.all(promises).then(function(allData) { // this will run when all promises have returned
   callback(JSON.stringify(allData));
  }, function(err) {
    console.log('oops, an error:', err);
    var errMsg = {action: "get people managed", statusCode: err.statusCode, statusMessage: err.statusMessage};
    callback(JSON.stringify(errMsg));
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
