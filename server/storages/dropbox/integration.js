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

'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var Credentials = require('./../../credentials');
// forge config information, such as client ID and secret
var config = require('./../../config');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var request = require('request');

// web framework
var express = require('express');
var router = express.Router();

var utility = require('./../utility');

var Dropbox = require('dropbox');

router.post('/api/storage/createFolder', jsonParser, function (req, res) {
  var token = new Credentials(req.session);
  if (token.getStorageCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  if (parentFolder === '' || folderName === '') {
    res.status(500).end('Invalid parentId or folderName');
    return;
  }

  var parentFolder = req.body.parentFolder;
  var folderName = req.body.folderName;
  var parentPath = parentFolder === '#' ? '' : parentFolder;
  var path = parentPath + "/" + folderName;

  var dbx = new Dropbox({accessToken: token.getStorageCredentials().access_token})

  dbx.filesGetMetadata({path: path})
    .then(function (folderInfo) {
      res.json({folderId: folderInfo.path_display});
      return
    })
    .catch(function (error) {
      console.log(error.error.error_summary);
      // If the folder does not exist then let's create it
      dbx.filesCreateFolder({path: path})
        .then(function (folderInfo) {
          res.json({folderId: folderInfo.path_display});
          return
        })
        .catch(function (error) {
          console.log(error.error.error_summary);
          res.status(500).end();
          return;
        })
    })
});

router.post('/api/storage/transferTo', jsonParser, function (req, res) {
  var token = new Credentials(req.session);
  var credentials = token.getStorageCredentials();
  if (credentials === undefined) {
    res.status(401).end();
    return;
  }

  utility.assertIsVersion(req.body.autodeskItem, req, function (autodeskVersionId) {
    utility.getVersion(autodeskVersionId, req, function (version) {

      var projectId = autodeskVersionId.split('/')[6];
      utility.getVersionURL(version, projectId, token, req, function (error, versionURL, extension) {
        var storageFolder = req.body.storageFolder;

        // now with the file created, let's prepare the transfer job\
        var source = {
          url: versionURL,
          method: "GET",
          headers: {
            'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
          },
          encoding: null
        };

        // file IDs to transfer
        var fileName = version.attributes.displayName
        if (extension) {
          fileName = fileName + extension;
        }

        var destination = {
          url: 'https://content.dropboxapi.com/2/files/upload',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token.getStorageCredentials().access_token,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify(
              {
                path: storageFolder + '/' + fileName,
                mode: "add",
                autorename: true,
                mute: false
              })
          }
        };

        // send Lambda job
        var id = utility.postLambdaJob(source, destination, token);

        res.json({taskId: id, status: utility.TRANSFER_STATUS.RECEIVED});
      });
    });
  });
});


router.post('/api/storage/transferFrom', jsonParser, function (req, res) {
  // >>>
  var token = new Credentials(req.session);
  var credentials = token.getStorageCredentials();
  if (token.getStorageCredentials() === undefined || token.getForgeCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  utility.assertIsFolder(req.body.autodeskFolder, req, function (autodeskProjectId, autodeskFolderId) {
    //<<<

    var dbx = new Dropbox({accessToken: credentials.access_token})

    dbx.filesGetMetadata({path: req.body.storageItem})
      .then(function (fileInfo) {
        var fileName = fileInfo.name; // name, that's all we need from Google

        // >>>
        utility.prepareAutodeskStorage(autodeskProjectId, autodeskFolderId, fileName, req, function (autodeskStorageUrl, skip, callbackData) {
          if (skip) {
            res.status(409).end(); // no action (server-side)
            return;
          }
          //<<<

          var source = {
            url: 'https://content.dropboxapi.com/2/files/download',
            method: "POST",
            headers: {
              'Authorization': 'Bearer ' + token.getStorageCredentials().access_token,
              'Dropbox-API-Arg': JSON.stringify(
                {
                  path: fileInfo.path_display
                })
            },
            encoding: null
          };

          var destination = {
            url: autodeskStorageUrl,
            method: "PUT",
            headers: {
              'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
            },
            encoding: null
          };

          // send Lambda job
          var id = utility.postLambdaJob(source, destination, token, callbackData /*returned from prepareAutodeskStorage, used to setup item/version */);

          res.json({taskId: id, status: utility.TRANSFER_STATUS.RECEIVED});
        });
      });
  });
});

module.exports = router;