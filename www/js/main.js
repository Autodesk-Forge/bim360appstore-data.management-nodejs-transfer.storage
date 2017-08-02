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
        '<span class="glyphicon glyphicon-log-out mlink" title="Sign out" id="autodeskLogoff"> </span>' +
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


      //var TRANSFER_STATUS = {
      //  RECEIVED: 0,
      //  STARTED: 1,
      //  TRANSFERRING: 2,
      //  ALMOST: 3,
      //  COMPLETED: 4,
      //  ERROR: 10
      //};

      socket.on('taskStatus', function (data) {
        var taskLabel = $('#' + data.taskId);
        console.log('Task ' + data.taskId + ': ' + taskLabel.children(0)[0].id + '>' + data.status);
        // avoid messages out of order
        if (!taskLabel.children(0) || !taskLabel.children(0)[0] ||  parseInt(taskLabel.children(0)[0].id) > data.status) return;
        taskLabel.empty();
        switch (data.status) {
          case 10:
            taskLabel.append('<span class="glyphicon glyphicon-alert" title="Error!" id="10"></span>');
            isDone(data);
            break;
          case 1: case 2:
            taskLabel.append('<span class="glyphicon glyphicon-transfer" title="Transfering..." id="2"></span>');
            break;
          case 3:
            taskLabel.append('<span class="glyphicon glyphicon-cog" title="Finalizing..." id="3"></span>');
            break;
          case 4:
            taskLabel.append('<span class="glyphicon glyphicon-ok" title="Completed!" id="4"></span>');
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
  if (data.tree) {
    var tree = $('#' + data.tree + 'Tree').jstree(true);
    tree.refresh_node(tree.get_selected(true)[0]);
  }
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
      _storageName = storageInfo.storageName;
      _needsAccountName = storageInfo.needsAccountName;

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
            '<div class="treeTitle" style="display: block"><img src="" id="storageProfilePicture" height="30px" class="profilePicture"> <span id="storageProfileName"></span> ' +
            '<span class="glyphicon glyphicon-log-out mlink" title="Sign Out" id="storageLogoff"> </span>' +
            '<div style="float: right"><button class="btn btn-default btn-xs" id="createStorageFolder"><span class="glyphicon glyphicon-folder-open"></span>&nbsp;&nbsp;New folder</button>' +
            '<span class="glyphicon glyphicon-refresh refreshIcon mlink" id="refreshStorageTree" title="Refresh files"/></div>' +
            '</div>' +
            '<div id="storageTree" class="tree"></div>');

          $('#storageProfileName').text(profile.name)
          $('#storageProfilePicture').attr('src', profile.picture);
          $('#storageLogoff').click(function () {
            location.href = '/api/app/logoff';
          });
          $('#createStorageFolder').click(createStorageFolder);

          prepareStorageTree();
        },
        error: function () {
          $('#storageSigninButton').click(function () {
            _accountName = undefined;
            if (_needsAccountName) {
              _accountName = prompt("Please provide account name", _needsAccountName);
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
  if (autodeskDestinationFolder.type != 'folders') {
    $("#transferFromStorageButton").notify(
      "The destination must be a folder",
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
  var foldersToCreate = [];
  var listOfFiles = $('#divListFilesToTransfer');
  listOfFiles.empty();
  var re = /(?:\.([^.]+))?$/; // regex to extract file extension
  storageNodes.forEach(function (item) {
    var extension = (re.exec(item.text)[1]);
    if (item.type === 'folders') {
      foldersToCreate.push({id: item.id, node: item, parentFolderAutodeskId: autodeskDestinationFolder.id});
      $('#storageTree').unbind('open_all.jstree').bind('open_all.jstree', function (e, data) {
        for (var n = 0; n < data.node.children_d.length; n++) {
          var itemId = data.node.children_d[n];

          var node = storageTree.get_node('#' + itemId);
          if (node.type === 'folders') {
            var contains = false;
            for (var f in foldersToCreate) {
              if (foldersToCreate[f].id === itemId)
                contains = true;
            }
            if (!contains)
              foldersToCreate.push({id: itemId, node: node});
          }


          if (node.type === 'folders') continue;
          if ($(":checkbox[value='|" + itemId + "']").length > 0) continue;

          var parent = storageTree.get_node('#' + node.parent);
          listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="|' + itemId + '" checked>' + parent.text + '/' + node.text + '</label></div>');
        }
      });
      storageTree.open_all(item);
    }
    else if (!extension)
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + item.id + '" disabled>' + item.text + ' <span class="label label-danger">File without extension is not supported</span></label></div>');
    else {
      var parent = $("#autodeskTree").jstree().get_node('#' + item.parent);
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + item.id + '" checked> ' + item.text + '</label></div>');
    }
  });

  $('#divListFilesFooter')
    .empty()
    .append('<div>Destination ' + autodeskDestinationFolder.type.replace('a360', '').slice(0, -1) + ': <strong>' + autodeskDestinationFolder.text + '</strong></div>')
    .append('<div><br/>Name conflict resolution: <label class="radio-inline"><input type="radio" name="ConflictResolution" value="newVersion" checked>Create new version</label><label class="radio-inline"><input type="radio" name="ConflictResolution"  value="skip">Skip</label></div>');

  // on button click, start transfering
  $("#transferFiles").click(function () {
    $(this).unbind('click');
    var count = 0;

    var checkBoxes = $(':checkbox:checked');
    if (checkBoxes.length == 0) {
      $(this).notify(
        "Nothing selected",
        {position: "bottom", className: 'error'}
      );
      return;
    }

    $(this).prop('disabled', true);
    $(this).html('Preparing folders...');

    console.log('Folders: ' + foldersToCreate.length);
    for (var f in foldersToCreate) {
      var folderToCreate = foldersToCreate[f];
      $.ajax({
        url: '/api/forge/createFolder',
        contentType: 'application/json',
        type: 'POST',
        async: false, // need all folder to be ready before transferring
        //dataType: 'json', comment this to avoid parsing the response which would result in an error
        data: JSON.stringify({
          'parentFolder': folderToCreate.parentFolderAutodeskId,
          'folderName': folderToCreate.node.text
        }),
        success: function (res) {
          $(this).html('Preparing folders...');
          folderToCreate.folderAutodeskId = res.folderId;
          for (var f1 in foldersToCreate) {
            var folderToCreateUpdate = foldersToCreate[f1];
            if (folderToCreateUpdate.node.parent == folderToCreate.id)
              folderToCreateUpdate.parentFolderAutodeskId = res.folderId;
          }
        },
        error: function (res) {
        }
      });
    }

    $(this).html('Transfering...');
    console.log('Files: ' + checkBoxes.length);
    checkBoxes.each(function (i) {
      var checkBox = $(this);
      var itemDiv = checkBox.parent().parent();
      // this is basically a place holder
      var tempId = btoa(checkBox.val()).replace(/=/g, '');
      itemDiv.prepend('<div style="float: right;" id="' + tempId + '"><span class="glyphicon glyphicon-hourglass"  title="Preparing..." id="0"></span></div>');
      count++;

      function sendRequest(autodeskFolder, storageItem) {
        console.log('Transfer ' + storageItem + ' to ' + autodeskFolder);
        // submit the request for transfer
        jQuery.ajax({
          url: '/api/storage/transferFrom',
          contentType: 'application/json',
          type: 'POST',
          //dataType: 'json', comment this to avoid parsing the response which would result in an error
          data: JSON.stringify({
            'storageItem': storageItem,
            'autodeskFolder': autodeskFolder,
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
      }

      var params = checkBox.val().split('|');
      if (params[0] === '') { // need to recheck the newly created folder
        var storageTreeNodeToTransfer = storageTree.get_node('#' + params[1]);
        var parentFolder = storageTreeNodeToTransfer.parent;
        for (var f in foldersToCreate) {
          var newFolder = foldersToCreate[f];
          if (newFolder.node.id == parentFolder) {
            sendRequest(newFolder.folderAutodeskId, params[1]);
          }
        }
      }
      else {
        sendRequest(params[0], params[1]);
      }
    });
  });
}

function createStorageFolder() {
  var date = new Date();

  var suggestedFolderName = 'Backup_' + zeroPad(date.getMonth() + 1, 2) + '_' + date.getFullYear();
  var folderName = prompt('Enter new folder name:', suggestedFolderName);
  if (folderName === null)return;

  var storageTree = $('#storageTree').jstree(true);
  var storageNodes = storageTree.get_selected(true);
  var parentFolder;
  if (storageNodes.length == 0)
    parentFolder = '#';
  else if (storageNodes[0].type === 'folders')
    parentFolder = storageNodes[0].id;
  else
    parentFolder = storageNodes[0].parents[0];

  jQuery.ajax({
    url: '/api/storage/createFolder',
    contentType: 'application/json',
    type: 'POST',
    //dataType: 'json', comment this to avoid parsing the response which would result in an error
    data: JSON.stringify({
      'parentFolder': parentFolder,
      'folderName': folderName
    }),
    success: function (res) {
      $('#storageTree').bind('refresh_node.jstree refresh.jstree', function (e, data) {
        storageTree.deselect_all();
        storageTree.select_node(res.folderId);
        $('#storageTree').unbind('refresh_node.jstree refresh.jstree');
      });

      if (parentFolder === '#')
        storageTree.refresh();
      else
        storageTree.refresh_node(storageNodes[0]);


    },
    error: function (res) {
      storageTree
    }
  });
}

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

$.notify.addStyle('newFolderNotify', {
  html: "<div>" +
  "<div class='clearfix'>" +
  "<div class='title' data-notify-html='title'/>" +
  "<div class='buttons'>" +
  "<button class='btn btn-default btn-xs createStorageFolder'><span class='glyphicon glyphicon-folder-open'></span>&nbsp;&nbsp;New folder</button>" +
  "</div>" +
  "</div>" +
  "</div>"
});
$(document).on('click', '.notifyjs-newFolderNotify-base .createStorageFolder', function () {
  createStorageFolder();
});

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
    $("#transferToStorageButton").notify({
        title: "Please select one destination folder"
      },
      {position: "bottom", style: 'newFolderNotify'}
    );
    return;
  }

  var storageDestinationFolder = storageNodes[0];
  if (storageDestinationFolder.type != 'folders') {
    $("#transferToStorageButton").notify({
        title: "The destination must be a folder"
      },
      {position: "bottom", style: 'newFolderNotify'}
    );
    return;
  }

  $("#modalFilesToTransfer").modal();

  // list files to transfer
  var foldersToCreate = [];
  var listOfFiles = $('#divListFilesToTransfer');
  listOfFiles.empty();
  autodeskNodes.forEach(function (item) {
    if (item.type === 'items') {
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + storageDestinationFolder.id + '|' + item.id + '" checked>' + item.text + ' (last version)</label></div>');
    }
    else if (item.type === 'versions') {
      var parent = $("#autodeskTree").jstree().get_node('#' + item.parent);
      listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="' + storageDestinationFolder.id + '|' + item.id + '" checked> ' + parent.text + ' (' + item.text + ')</label></div>');
    }
    else if (item.type === 'folders') {
      foldersToCreate.push({href: item.id, node: item, parentFolderStorageId: storageDestinationFolder.id});
      $('#autodeskTree').unbind('open_all.jstree').bind('open_all.jstree', function (e, data) {
        for (var n = 0; n < data.node.children_d.length; n++) {
          var href = data.node.children_d[n];

          var node = autodeskTree.get_node('#' + href);
          if (href.indexOf('/folders/') > 0) {
            var contains = false;
            for (var f in foldersToCreate) {
              if (foldersToCreate[f].href === href)
                contains = true;
            }
            if (!contains)
              foldersToCreate.push({href: href, node: node});
          }


          if (href.indexOf('/versions/') > 0 || href.indexOf('/folders/') > 0) continue;
          if ($(":checkbox[value='|" + href + "']").length > 0) continue;

          var parent = autodeskTree.get_node('#' + node.parent);
          listOfFiles.append('<div class="checkbox transferItem"><label><input type="checkbox" value="|' + href + '" checked>' + parent.text + '/' + node.text + ' (last version)</label></div>');
        }
        //console.log(foldersToCreate);
      });
      autodeskTree.open_all(item);
    }
  });


  $('#divListFilesFooter').empty().append('<div>Destination folder: <strong>' + storageDestinationFolder.text + '</strong></div>');

  // on button click, start transfering
  $("#transferFiles").click(function () {
    $(this).unbind('click');
    var count = 0;

    var checkBoxes = $(':checkbox:checked');
    if (checkBoxes.length == 0) {
      $(this).notify(
        "Nothing selected",
        {position: "bottom", className: 'error'}
      );
      return;
    }

    $(this).prop('disabled', true);
    $(this).html('Preparing folders...');

    //the Folder structure is ready
    console.log('Folders: ' + foldersToCreate.length);
    for (var f in foldersToCreate) {
      var folderToCreate = foldersToCreate[f];
      $.ajax({
        url: '/api/storage/createFolder',
        contentType: 'application/json',
        type: 'POST',
        async: false, // need all folder to be ready before transferring
        //dataType: 'json', comment this to avoid parsing the response which would result in an error
        data: JSON.stringify({
          'parentFolder': folderToCreate.parentFolderStorageId,
          'folderName': folderToCreate.node.text
        }),
        success: function (res) {
          $(this).html('Preparing folders...');
          folderToCreate.folderStorageId = res.folderId;
          for (var f1 in foldersToCreate) {
            var folderToCreateUpdate = foldersToCreate[f1];
            if (folderToCreateUpdate.node.parent == folderToCreate.href)
              folderToCreateUpdate.parentFolderStorageId = res.folderId;
          }
        },
        error: function (res) {
        }
      });
    }

    $(this).html('Transferring...');

    console.log('Files: ' + checkBoxes.length);
    checkBoxes.each(function (i) {
      var checkBox = $(this);
      var itemDiv = checkBox.parent().parent();
      // this is basically a place holder
      var tempId = btoa(checkBox.val()).replace(/=/g, '');
      itemDiv.prepend('<div style="float: right;" id="' + tempId + '"><span class="glyphicon glyphicon-hourglass"  title="Preparing..." id="0"></span></div>');
      count++;
      // submit the request for transfer
      var params = checkBox.val().split('|');

      function sendRequest(storageFolder, autodeskItem) {
        console.log('Transfer ' + autodeskItem + ' to ' + storageFolder);
        jQuery.ajax({
          url: '/api/storage/transferTo',
          contentType: 'application/json',
          type: 'POST',
          //dataType: 'json', comment this to avoid parsing the response which would result in an error
          data: JSON.stringify({
            'autodeskItem': autodeskItem,
            'storageFolder': storageFolder
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
      }


      if (params[0] === '') { // need to recheck the newly created folder
        var autodeskTreeNodeToTransfer = autodeskTree.get_node('#' + params[1]);
        var parentFolder = autodeskTreeNodeToTransfer.parent;
        for (var f in foldersToCreate) {
          var newFolder = foldersToCreate[f];
          if (newFolder.node.id == parentFolder) {
            sendRequest(newFolder.folderStorageId, params[1]);
          }
        }
      }
      else {
        sendRequest(params[0], params[1]);
      }
    });
  });
}