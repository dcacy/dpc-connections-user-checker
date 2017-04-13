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

var openRows = [];

function getMgrsData() {
  $('#loadingDiv').mask('Please Wait...<br/><img src="/images/watson.gif">');
  $.ajax({
    type: "GET",
    url: "/getMgrsInfo",
    dataType: 'json',

    success: function (data, status, jq) {
      var table = $('#mgrsTable').DataTable( {
        data: data,
        responsive: true,
        "columns": [
            {
                "className": 'details-control',
                "defaultContent": ''
            },
            { "data": "name" },
            { "data": "email" },
            { "data": "nbrOfEmployees" },
        ],
        "columnDefs" : [
          { "title": "Name", "targets": 1 },
          { "title": "Email", "targets": 2 },
          { "title": "Nbr of Employees", "targets": 3 }
        ]
      });

      $('#mgrsTable tbody').on('click', 'td.details-control', function () {
        var tr = $(this).closest('tr');
        var row = table.row( tr );
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            closeOpenedRows(table, tr);
            showDetails(row.data(), function(html) {
              row.child(html).show();
            });
            tr.addClass('shown');
            openRows.push(tr);
        }
      });
      $('#loadingDiv').unmask();
    },
    error: function(jq, status, error) {
      console.log('error! ', error);
    }
  });
}

function formatDate(connectionsDate) {
  // date looks like 2016-09-30T01:04:49.546Z
	var dateIso = connectionsDate.split('T');
	var time = dateIso[1].split("."); // we don't care about 10ths of a second
	var splitIso = dateIso[0].split("-");
	var uYear = splitIso[0];
	var uMonth = splitIso[1];
	var uDay = splitIso[2];
	var uDate = uYear + '-' + uMonth + '-' + uDay + ' ' + time[0] + ' UTC';
	return uDate;
}

function closeOpenedRows(table, selectedRow) {
  $.each(openRows, function (index, openRow) {
    // not the selected row!
    if ($.data(selectedRow) !== $.data(openRow)) {
      var rowToCollapse = table.row(openRow);
      rowToCollapse.child.hide();
      openRow.removeClass('shown');
      // replace icon to expand
      $(openRow).find('td.details-control').html('<span class="glyphicon glyphicon-plus"></span>');
      // remove from list
      var index2 = $.inArray(selectedRow, openRows);
      openRows.splice(index2, 1);
    }
  });
}

function showDetails(manager, callback) {
  var html = '';
  if ( manager.peopleManaged ) {
    $('#loadingDiv').mask('Please Wait...<br/><img src="/images/watson.gif">');
    $.ajax({
      type: "POST",
      url: "/getUserActivity",
      dataType: 'json',
      data: JSON.stringify(manager.peopleManaged),
      headers: {
        'Content-Type': 'application/json'
      },
      success: function (data, status, jq) {
        html += '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;width:95%;">';
        for (var i = 0; i < data.length; i++) {
          html += '<tr style="width:400px;"><td colspan="4"><span style="font-weight:bold">' + data[i].name + '</span></td><tr>';
          if ( data[i].activity.length > 0 ) {
            for (var j = 0; j < data[i].activity.length; j++ ) {
              html += '<tr style="width:400px;">'
                + '<td>&nbsp;</td>'
                + '<td>' + data[i].activity[j].shortTitle + '</td>'
                + '<td>' + formatDate(data[i].activity[j].publishedDate) + '</td>'
                + '<td><a href="' + data[i].activity[j].itemUrl + '" target="_new">link</a></td>'
                + '</tr>';
              }
            } else {
              html += '<tr><td align="center" colspan="4">No entries for this date range</td></tr>';
          }
        }
        html += '</table>';
        $('#loadingDiv').unmask();
        callback(html);
      },
      error: function(jq, status, error) {
        console.log('error! ', error, jq);
        alert(jq.responseText);
      }
    });
  } else {
    callback('<table><tr><td>No Employees listed</td></tr></table>');
  }
}
