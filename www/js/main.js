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

$(document).ready(function () {
  prepareAutodeskSide();
  prepareStorageSide();

  $('#transferToStorageButton').click(transferToStorage);
  $('#transferFromStorageButton').click(transferToAutodesk);
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
        '<div class="treeTitle"><img src="" id="autodeskProfilePicture" height="30px"> <span id="autodeskProfileName"></span>' +
        '<span class="glyphicon glyphicon-refresh refreshIcon" id="refreshAutodeskTree" title="Refresh Autodesk files"/>' +
        '</div>' +
        '<div id="autodeskTree" class="tree"></div>');

      $('#autodeskProfileName').text(profile.name)
      $('#autodeskProfilePicture').attr('src', profile.picture);

      prepareAutodeskTree('autodeskTree');
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

function prepareStorageSide() {
  jQuery.ajax({
    url: '/api/storageName',
    success: function (storageName) {
      _storageName = storageName;

      // preparing icons and titles
      $('#storageSigninIcon').attr("src", 'img/' + storageName + '/icon.png');
      $('#tranferToStorageButton').attr("title", 'Transfer selected BIM 360 files to ' + storageName);
      $('#transferFromStorageButton').attr("title", 'Transfer selected ' + storageName + ' files to BIM 360');

      jQuery.ajax({
        url: '/api/storage/profile',
        success: function (profile) {
          var storageSide = $('#storageSide');
          storageSide.empty();
          storageSide.css("vertical-align", "top");
          storageSide.css('text-align', 'left');
          storageSide.append(
            '<div class="treeTitle"><img src="" id="storageProfilePicture" height="30px"> <span id="storageProfileName"></span>' +
            '<span class="glyphicon glyphicon-refresh refreshIcon" id="refreshStorageTree" title="Refresh files"/>' +
            '</div>' +
            '<div id="storageTree" class="tree"></div>');

          $('#storageProfileName').text(profile.name)
          $('#storageProfilePicture').attr('src', profile.picture);

          prepareStorageTree();
        },
        error: function () {
          $('#storageSigninButton').click(function () {
            jQuery.ajax({
              url: '/api/storage/signin',
              success: function (storageOAuthURL) {
                location.href = storageOAuthURL;
              }
            });
          });
        }
      });
    }
  });
}

function transferToAutodesk() {
  var autodeskTree = $('#autodeskTree').jstree(true);
  var storageTree = $('#storageTree').jstree(true);

  if (!autodeskTree || !storageTree)
  {
    $("#transferFromStorageButton").notify(
      "Please sign in first",
      {position: "bottom", className: 'error'}
    );
    return;
  }
}

function transferToStorage() {
  var autodeskTree = $('#autodeskTree').jstree(true);
  var storageTree = $('#storageTree').jstree(true);

  if (!autodeskTree || !storageTree)
  {
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
      "Please select destination folder",
      {position: "bottom", className: 'warn'}
    );
    return;
  }

  var storageDestinationFolder = storageNodes[0];
  if (storageDestinationFolder.type != 'folders') {
    $("#transferToStorageButton").notify(
      "The destination must be a folder",
      {position: "bottom", className: 'warn'}
    );
    return;
  }

  $("#modalFilesToTransfer").modal();

  var listOfFiles = $('#listFilesToTransfer');
  listOfFiles.empty();
  autodeskNodes.forEach(function (item) {
    if (item.type === 'items') {
      listOfFiles.append('<div class="checkbox"><label><input type="checkbox" value="' + item.id + '" checked>' + item.text + ' (last version)</label></div>');
    }
    else if (item.type === 'versions') {
      var parent = $("#autodeskTree").jstree().get_node('#' + item.parent);
      listOfFiles.append('<div class="checkbox"><label><input type="checkbox" value="' + item.id + '" checked> ' + parent.text + ' (' + item.text + ')</label></div>');
    }
    else if (item.type === 'folders')
      listOfFiles.append('<div class="checkbox"><label><input type="checkbox" value="' + item.id + '" disabled>' + item.text + ' <span class="label label-danger">Folders are not supported</span></label></div>');
  });

  listOfFiles.append('<div>Destination folder: <strong>' + storageDestinationFolder.text + '</strong></div>')

  $("#transferFiles").click(function () {
    $(':checkbox:checked').each(function(i){
      jQuery.ajax({
        url: '/api/storage/transferTo',
        contentType: 'application/json',
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
          'autodeskItem': $(this).val(),
          'storageFolder': storageDestinationFolder.id
        }),
        success: function (res) {
        },
        error: function (res) {
        }
      });

    });
    $('#modalFilesToTransfer').modal('toggle');
    //$('#autodeskTree').jstree(true).refresh();
  });
}