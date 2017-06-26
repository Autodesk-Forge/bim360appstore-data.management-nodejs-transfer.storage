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
});

function prepareAutodeskSide() {
  jQuery.ajax({
    url: '/api/forge/profile',
    success: function (profile) {
      // if profile is OK, then user is logged in
      // start preparing for tree
      var autodeskSide = $('#autodeskSide');
      autodeskSide.empty();
      autodeskSide.css("vertical-align","top");
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

function prepareStorageSide(){
  jQuery.ajax({
    url: '/api/storageName',
    success: function (storageName) {
      _storageName = storageName;

      // preparing icons and titles
      $('#storageSigninIcon').attr("src", 'img/' + storageName + '/icon.png');
      $('#tranferToButton').attr("title", 'Transfer selected BIM 360 files to ' + storageName);
      $('#transferFromButton').attr("title", 'Transfer selected ' + storageName + ' files to BIM 360');

      jQuery.ajax({
        url: '/api/storage/profile',
        success: function (profile) {
          var storageSide = $('#storageSide');
          storageSide.empty();
          storageSide.css("vertical-align","top");
          storageSide.css('text-align', 'left');
          storageSide.append(
            '<div class="treeTitle"><img src="" id="storageProfilePicture" height="30px"> <span id="storageProfileName"></span>' +
            '<span class="glyphicon glyphicon-refresh refreshIcon" id="refreshStorageTree" title="Refresh files"/>' +
            '</div>' +
            '<div id="storageTree" class="tree"></div>');

          $('#storageProfileName').text(profile.name)
          $('#storageProfilePicture').attr('src', profile.picture);
        },
        error: function(){
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

      $('#tranferToButton').click(function () {});
      $('#tranferFromButton').click(function () {});
    }
  });
}