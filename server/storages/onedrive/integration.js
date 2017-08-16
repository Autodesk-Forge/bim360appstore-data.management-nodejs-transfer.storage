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

var forgeSDK = require('forge-apis');

// OneDrive SDK
const msGraph = require("@microsoft/microsoft-graph-client").Client

// web framework
var express = require('express');
var router = express.Router();

var utility = require('./../utility');

function respondWithError(res, error) {
  if (error.statusCode) {
    res.status(error.statusCode).end(error.statusMessage ? error.statusMessage : error.message)
  } else {
    res.status(500).end(error.message)
  }
}

router.post('/api/storage/createFolder', jsonParser, function (req, res) {
  var token = new Credentials(req.session);
  if (token.getStorageCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  var parentFolder = req.body.parentFolder;
  var folderName = req.body.folderName;

  if (parentFolder === '' || folderName === '') {
    res.status(500).end('Invalid parentId or folderName');
    return;
  }

  var msGraphClient = msGraph.init({
    defaultVersion: 'v1.0',
    debugLogging: true,
    authProvider: function (done) {
      done(null, token.getStorageCredentials().access_token)
    }
  })

  var path = ''
  var onedriveDriveId = ''
  if (parentFolder === '#') {
    path = '/drive/root/children'
  } else {
    var idParts = parentFolder.split(':')
    onedriveDriveId = idParts[0]
    parentFolder = idParts[1]
    path = '/drives/' + onedriveDriveId + '/items/' + parentFolder + '/children'
  }

  // Get children of the parent folder to see if it exists already
  msGraphClient
    .api(path)
    .get(function (err, fileInfo) {
      if (err) {
        // Handle errorjstree
        console.log(err.message);
        res.status(500).end();
        return;
      }

      var fileName = fileInfo.name;

      for (var key in fileInfo.value) {
        var child = fileInfo.value[key]
        if (child.folder && child.name === folderName) {
          res.json({folderId: onedriveDriveId + ":" + child.id});
          return;
        }
      }

      // If we did not find the folder then lets create it
      // Note: if folder name only differs in lower/upper characters
      // then the existing fodler will get renamed: e.g. if there is a folder named "backup"
      // and we now create "Backup", then the original folder will be renamed "Backup"
      msGraphClient
        .api(path)
        .post({
          "name": folderName,
          "folder": { }
        }, function (err, fileInfo) {
          if (err) {
            // Handle errorjstree
            console.log(err.message);
            res.status(500).end();
            return;
          }
          
          res.json({folderId: onedriveDriveId + ":" + fileInfo.id});
          return
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
      var storageFolder = req.body.storageFolder;

      // now with the file created, let's prepare the transfer job\
      var source = {
        url: version.relationships.storage.meta.link.href,
        method: "GET",
        headers: {
          'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
        },
        encoding: null
      };

      // file IDs to transfer
      var idParts = storageFolder.split(':')
      var onedriveDriveId = idParts[0]
      var storageFolder = idParts[1]
      var fileName = version.attributes.name;

      var destination = {
        url: 'https://graph.microsoft.com/v1.0/drives/' + onedriveDriveId + '/items/' + storageFolder + '/children/' + fileName + '/content',
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token.getStorageCredentials().access_token
        }
      };

      // send Lambda job
      var id = utility.postLambdaJob(source, destination, token);

      res.json({taskId: id, status: utility.TRANSFER_STATUS.RECEIVED});
    });
  });
});

router.post('/api/storage/transferFrom', jsonParser, function (req, res) {
  // >>>
  var token = new Credentials(req.session);
  if (token.getStorageCredentials() === undefined || token.getForgeCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  utility.assertIsFolder(req.body.autodeskFolder, req, function (autodeskProjectId, autodeskFolderId) {
    //<<<
    var storageId = req.body.storageItem;
    var idParts = storageId.split(':')
    var driveId = idParts[0]
    storageId = idParts[1]
    var path = '/drives/' + driveId + '/items/' + storageId
    var msGraphClient = msGraph.init({
      defaultVersion: 'v1.0',
      debugLogging: true,
      authProvider: function (done) {
        done(null, token.getStorageCredentials().access_token)
      }
    })

    msGraphClient
      .api(path)
      .get(function (err, fileInfo) {
          var fileName = fileInfo.name; // name, that's all we need from Google

      // >>>
      utility.prepareAutodeskStorage(autodeskProjectId, autodeskFolderId, fileName, req, function (autodeskStorageUrl, skip, callbackData) {
        if (skip) {
          res.status(409).end(); // no action (server-side)
          return;
        }
        //<<<

        var source = {
          url: 'https://graph.microsoft.com/v1.0/drives/' + driveId + '/items/' + storageId + '/content',
          method: "GET",
          headers: {
            'Authorization': 'Bearer ' + token.getStorageCredentials().access_token
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