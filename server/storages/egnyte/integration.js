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

var egnyteSDK = require('egnyte-js-sdk');

function respondWithError(res, error) {
  if (error.statusCode) {
    res.status(error.statusCode).end(error.statusMessage ? error.statusMessage : error.message)
  } else {
    res.status(500).end(error.message)
  }
}

router.post('/api/storage/createFolder', jsonParser, function (req, res) {
  var token = new Credentials(req.session);
  if (token.getStorageCredentials() === undefined || token.getForgeCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  var parentFolder = req.body.parentFolder;
  var folderName = req.body.folderName;

  if (parentFolder === '' || folderName === '') {
    res.status(500).end('Invalid parentId or folderName');
    return;
  }

  var egnyte = egnyteSDK.init(req.session.egnyteURL, {
    token: token.getStorageCredentials().access_token
  });

  // Try to get the subfolder
  var parentPath = parentFolder === '#' ? '/' : parentFolder;
  var path = parentPath + '/' + folderName;
  var pathInfo = egnyte.API.storage.path(path);
  pathInfo.get()
    .then(function (folderInfo) {
      res.json({folderId: folderInfo.path});
      return
    })
    .catch(function (error) {
      // The folder does not exist so let's create it
      pathInfo.createFolder()
        .then(function (folderInfo) {
          res.json({folderId: folderInfo.path});
          return
        })
        .catch(function (error) {
          console.log(err.message);
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
      var fileName = version.attributes.name;

      var destination = {
        url: req.session.egnyteURL + '/pubapi/v1/fs-content/' + storageFolder + "/" + fileName,
        method: 'POST',
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
  var credentials = token.getStorageCredentials();
  if (token.getStorageCredentials() === undefined || token.getForgeCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  utility.assertIsFolder(req.body.autodeskFolder, req, function (autodeskProjectId, autodeskFolderId) {
    //<<<

    var egnyte = egnyteSDK.init(req.session.egnyteURL, {
      token: credentials.access_token
    });

    var pathInfo = egnyte.API.storage.path(req.body.storageItem);
    pathInfo.get()
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
          url: req.session.egnyteURL + '/pubapi/v1/fs-content/' + req.body.storageItem,
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