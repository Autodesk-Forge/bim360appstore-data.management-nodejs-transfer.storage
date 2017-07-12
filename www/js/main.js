/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

var _storageName;
var _needsAccountName;
var _accountName;
var _pendingTransfers = [];

var socket = io.connect(location.host);

$(document).ready(function () {
  prepareAutodeskSide();
  prepareStorageSide();

  $('#transferToStorageButton').click(transferToStorage);
  $('#transferFromStorageButton').click(transferToAutodesk);

  $('#modalFilesToTransfer').on('hidden.bs.modal', function () {
    var transferFilesButton = $("#transferFiles");
    transferFilesButton.unbind('click');
    transferFilesButton.prop('disabled', false);
    transferFilesButton.html('Start transfer');
    _pendingTransfers = null;
    _pendingTransfers = [];
  });
});

function prepareAutodeskSide() {
  jQuery.ajax({
    url: '/api/forge/profile',
    success: function (profile) {
      // if profile is OK, then user is logged in
      // start preparing for tree
      var autodeskSide = $('#autodeskSide');
      autodeskSide.empty();
      autodeskSide.css("vertical-align", "top");
      autodeskSide.css('text-align', 'left');
      autodeskSide.append(
        '<div class="treeTitle"><img src="" id="autodeskProfilePicture" height="30px" class="profilePicture"> <span id="autodeskProfileName"></span> ' +
        '<span class="glyphicon glyphicon-log-out mlink" title="Logoff" id="autodeskLogoff"> </span>' +
        '<span class="glyphicon glyphicon-refresh refreshIcon mlink" id="refreshAutodeskTree" title="Refresh Autodesk files"/>' +
        '</div>' +
        '<div id="autodeskTree" class="tree"></div>');

      $('#autodeskProfileName').text(profile.name);
      $('#autodeskProfilePicture').attr('src', profile.picture);
      $('#autodeskLogoff').click(function () {
        location.href = '/api/app/logoff';
      });

      prepareAutodeskTree('autodeskTree');

      socket.emit('join', {
        autodeskId: profile.id
      });

      socket.on('taskStatus', function (data) {
        var taskLabel = $('#' + data.taskId);
        taskLabel.empty();
        switch (data.status) {
          case 'error':
            taskLabel.append('<span class="glyphicon glyphicon-alert" title="Error!"></span>');
            isDone(data);
            break;
          case 'started':
            taskLabel.append('<span class="glyphicon glyphicon-transfer" title="Transfering..."></span>');
            break;
          case 'almost':
            taskLabel.append('<span class="glyphicon glyphicon-cog" title="Finalizing..."></span>');
            break;
          case 'completed':
            taskLabel.append('<span class="glyphicon glyphicon-ok" title="Completed!"></span>');
            isDone(data);
            break;
        }
      });
    },
    statusCode: {
      401: function () {
        // as profile is not authorized, this user is not authorized
        $('#autodeskSigninButton').click(function () {
          jQuery.ajax({
            url: '/api/forge/signin',
            success: function (forgeOAuthURL) {
              location.href = forgeOAuthURL;
            }
          });
        });
      }
    }
  });
}

function isDone(data) {
  _pendingTransfers.splice(_pendingTransfers.indexOf(data.taskId), 1);
  var tree = $('#' + data.tree + 'Tree').jstree(true);
  tree.refresh_node(tree.get_selected(true)[0]);
  if (_pendingTransfers.length == 0) {
    // from now, the use can dismiss this dialog
    var transferFilesButton = $("#transferFiles");
    transferFilesButton.unbind('click');
    transferFilesButton.html('Done');
    transferFilesButton.prop('disabled', false);
    transferFilesButton.click(function () {
      $('#modalFilesToTransfer').modal('toggle');
    });
  }
}

function prepareStorageSide() {
  jQuery.ajax({
    url: '/api/storageInfo',
    success: function (storageInfo) {
      _storageName = storageInfo.storageName
      _needsAccountName = storageInfo.needsAccountName

      // preparing icons and titles
      $('#storageSigninIcon').attr("src", 'img/' + _storageName + '/icon.png');
      $('#transferToStorageButton').attr("title", 'Transfer selected BIM 360 files to ' + _storageName);
      $('#transferFromStorageButton').attr("title", 'Transfer selected ' + _storageName + ' files to BIM 360');

      jQuery.ajax({
        url: '/api/storage/profile',
        success: function (profile) {
          var storageSide = $('#storageSide');
          storageSide.empty();
          storageSide.css("vertical-align", "top");
          storageSide.css('text-align', 'left');
          storageSide.append(
            '<div class="treeTitle"><img src="" id="storageProfilePicture" height="30px" class="profilePicture"> <span id="storageProfileName"></span> ' +
            '<span class="glyphicon glyphicon-log-out mlink" title="Logoff" id="storageLogoff"> </span>' +
            '<span class="glyphicon glyphicon-refresh refreshIcon mlink" id="refreshStorageTree" title="Refresh files"/>' +
            '</div>' +
            '<div id="storageTree" class="tree"></div>');

          $('#storageProfileName').text(profile.name)
          $('#storageProfilePicture').attr('src', profile.picture);
          $('#storageLogoff').click(function () {
            location.href = '/api/app/logoff';
          });

          prepareStorageTree();
        },
        error: function () {
          $('#storageSigninButton').click(function () {
            _accountName = undefined;
            if (_needsAccountName) {
              _accountName = prompt("Please provide account name", "autodesktesting");
            }

            if (_accountName || !_needsAccountName) {
              jQuery.ajax({
                url: '/api/storage/signin?accountName=' + _accountName,
                success: function (storageOAuthURL) {
                  location.href = storageOAuthURL;
                }
              });
            }
          });
        }
      });
    }
  });
}

function transferToAutodesk() {
  var autodeskTree = $('#autodeskTree').jstree(true);
  var storageTree = $('#storageTree').jstree(true);

  // basic error check
  if (!autodeskTree || !storageTree) {
    $("#transferFromStorageButton").notify(
      "Please sign in first",
      {position: "bottom", className: 'error'}
    );
    return;
  }

  var autodeskNodes = autodeskTree.get_selected(true);
  if (autodeskNodes === undefined || autodeskNodes.length != 1) {
    $("#transferFromStorageButton").notify(
      "Please select one destination folder",
      {position: "bottom", className: 'warn'}
    );
    return;
  }

  var autodeskDestinationFolder = autodeskNodes[0];
  if (autodeskDestinationFolder.type != 'folders' && autodeskDestinationFolder.type != 'a360projects') {
    $("#transferFromStorageButton").notify(
      "The destination must be a folder or A360 project\n(BIM 360 project is not supported)",
      {position: "bottom", className: 'error'}
    );
    return;
  }

  var storageNodes = storageTree.get_selected(true);
  if (storageNodes === undefined || storageNodes.length == 0) {
    $("#transferFromStorageButton").notify(
      "Please select files to transfer",
      {position: "bottom", className: 'warn'}
    );
    return;
  }

  $("#modalFilesToTransfer").modal();

  // list files to transfer
  var listOfFiles = $('#divListFilesToTransfer');
  listOfFiles.empty();
  var re = /(?:\.([^.]+))?$/; // regex to extract file extension
  storageNodes.forEach(function (item) {
    var extension = (re.exec(item.text)[1]);
    if (item.type === 'folders')
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + item.id + '" disabled>' + item.text + ' <span class="label label-danger">Folders are not supported</span></label></div>');
    else if (!extension)
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + item.id + '" disabled>' + item.text + ' <span class="label label-danger">File without extension is not supported</span></label></div>');
    else {
      var parent = $("#autodeskTree").jstree().get_node('#' + item.parent);
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + item.id + '" checked> ' + item.text + '</label></div>');
    }
  });

  listOfFiles.append('<div>Destination ' + autodeskDestinationFolder.type.replace('a360', '').slice(0, -1) + ': <strong>' + autodeskDestinationFolder.text + '</strong></div>');

  listOfFiles.append('<div><br/>Name conflict resolution: <label class="radio-inline"><input type="radio" name="ConflictResolution" value="newVersion" checked>Create new version</label><label class="radio-inline"><input type="radio" name="ConflictResolution"  value="skip">Skip</label></div>');

  // on button click, start transfering
  $("#transferFiles").click(function () {
    var count = 0;
    $(':checkbox:checked').each(function (i) {
      var checkBox = $(this);
      var itemDiv = checkBox.parent().parent();
      // this is basically a place holder
      var tempId = btoa(checkBox.val()).replace(/=/g, '');
      itemDiv.prepend('<div style="float: right;" id="' + tempId + '"><span class="glyphicon glyphicon-hourglass"  title="Preparing..."></span></div>');
      count++;
      // submit the request for transfer
      jQuery.ajax({
        url: '/api/storage/transferFrom',
        contentType: 'application/json',
        type: 'POST',
        //dataType: 'json', comment this to avoid parsing the response which would result in an error
        data: JSON.stringify({
          'storageItem': checkBox.val(),
          'autodeskFolder': autodeskDestinationFolder.id,
          'conflict': $("input[name='ConflictResolution']:checked").val()
        }),
        success: function (res) {
          _pendingTransfers.push(res.taskId);
          $('#' + tempId).attr("id", res.taskId); // adjust the id to the taskId, for sockets
        },
        statusCode: {
          409: function () {
            $('#' + tempId).empty();
            $('#' + tempId).append('<span class="glyphicon glyphicon-ban-circle" title="Duplicated, skip"></span>');
          }
        },
        error: function (res) {
          $('#' + tempId).empty();
          $('#' + tempId).append('<span class="glyphicon glyphicon-alert" title="Error!"></span>');
        }
      });
    });
    if (count > 0) {
      $(this).prop('disabled', true);
      $(this).html('Working...');
    }
    else {
      $(this).notify(
        "Nothing selected",
        {position: "bottom", className: 'error'}
      );
    }
  });
}

function transferToStorage() {
  var autodeskTree = $('#autodeskTree').jstree(true);
  var storageTree = $('#storageTree').jstree(true);

  // basic error check
  if (!autodeskTree || !storageTree) {
    $("#transferToStorageButton").notify(
      "Please sign in first",
      {position: "bottom", className: 'error'}
    );
    return;
  }
  var autodeskNodes = autodeskTree.get_selected(true);
  if (autodeskNodes === undefined || autodeskNodes.length == 0) {
    $("#transferToStorageButton").notify(
      "Please select files to transfer",
      {position: "bottom", className: 'warn'}
    );
    return;
  }

  var storageNodes = storageTree.get_selected(true);
  if (storageNodes === undefined || storageNodes.length != 1) {
    $("#transferToStorageButton").notify(
      "Please select one destination folder",
      {position: "bottom", className: 'warn'}
    );
    return;
  }

  var storageDestinationFolder = storageNodes[0];
  if (storageDestinationFolder.type != 'folders') {
    $("#transferToStorageButton").notify(
      "The destination must be a folder",
      {position: "bottom", className: 'error'}
    );
    return;
  }

  $("#modalFilesToTransfer").modal();

  // list files to transfer
  var listOfFiles = $('#divListFilesToTransfer');
  listOfFiles.empty();
  autodeskNodes.forEach(function (item) {
    if (item.type === 'items') {
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + item.id + '" checked>' + item.text + ' (last version)</label></div>');
    }
    else if (item.type === 'versions') {
      var parent = $("#autodeskTree").jstree().get_node('#' + item.parent);
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + item.id + '" checked> ' + parent.text + ' (' + item.text + ')</label></div>');
    }
    else if (item.type === 'folders')
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + item.id + '" disabled>' + item.text + ' <span class="label label-danger">Folders are not supported</span></label></div>');
  });

  listOfFiles.append('<div>Destination folder: <strong>' + storageDestinationFolder.text + '</strong></div>')

  // on button click, start transfering
  $("#transferFiles").click(function () {
    var count = 0;
    $(':checkbox:checked').each(function (i) {
      var checkBox = $(this);
      var itemDiv = checkBox.parent().parent();
      // this is basically a place holder
      var tempId = btoa(checkBox.val()).replace(/=/g, '');
      itemDiv.prepend('<div style="float: right;" id="' + tempId + '"><span class="glyphicon glyphicon-hourglass"  title="Preparing..."></span></div>');
      count++;
      // submit the request for transfer
      jQuery.ajax({
        url: '/api/storage/transferTo',
        contentType: 'application/json',
        type: 'POST',
        //dataType: 'json', comment this to avoid parsing the response which would result in an error
        data: JSON.stringify({
          'autodeskItem': checkBox.val(),
          'storageFolder': storageDestinationFolder.id
        }),
        success: function (res) {
          _pendingTransfers.push(res.taskId);
          $('#' + tempId).attr("id", res.taskId); // adjust the id to the taskId, for sockets
        },
        error: function (res) {
          $('#' + tempId).empty();
          $('#' + tempId).append('<span class="glyphicon glyphicon-alert" title="Error!"></span>');
        }
      });
    });

    if (count > 0) {
      $(this).prop('disabled', true);
      $(this).html('Working...');
    }
    else {
      $(this).notify(
        "Nothing selected",
        {position: "bottom", className: 'error'}
      );
    }
  });
}