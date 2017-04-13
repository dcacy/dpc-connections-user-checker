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
var dateMath = require('date-arithmetic');

function createDate() {
  var date = new Date();
  var newDate =  dateMath.subtract(new Date(), 30, 'day');
  return newDate.toISOString();
}

exports.getUserActivity = function(properties, peopleManaged, callback) {
  var promises = [];
  for ( var i = 0; i < peopleManaged.length; i++) {
      promises.push(makeGetUserActivityPromise(properties, peopleManaged[i]));
  }
  Promise.all(promises).then(function(allData) {
    callback(allData);
    }, function(err) {
      console.log('error! ', err.statusCode, err.statusMessage);
      callback({error: 'Error in getting User Activity: code = ' + err.statusCode + ', message = ' + err.statusMessage});
    }
  );
};

function makeGetUserActivityPromise(properties, report) {
  var dateToUse = createDate();
  return new Promise(function(resolve, reject) {
    var options = {
      host: properties.get('connections_host'),
      port: 443,
      method: 'GET',
      path: '/connections/opensocial/basic/rest/activitystreams/@public/@all?FilterBy=involved&filterOp=equals&updatedSince=' + dateToUse + '&filterValue=' + report.userid,
      auth: properties.get('connections_userid') + ':' + properties.get('connections_password'),
    };
    var request = https.request(options, function(response) {
      var data = "";
      response.on('data', function (chunk) {
        data += chunk;
      });
      response.on('end', function() {
        if ( response.statusCode === 200 ) {
          var json = JSON.parse(data);
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
