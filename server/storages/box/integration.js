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

// web framework
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

// box sdk: https://github.com/box/box-node-sdk/
var BoxSDK = require('box-node-sdk');
var request = require('request');

var utility = require('./../utility');

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

  var sdk = new BoxSDK({
    clientID: config.storage.credentials.client_id, // required
    clientSecret: config.storage.credentials.client_secret // required
  });
  var box = sdk.getBasicClient(token.getStorageCredentials().accessToken);

  box.folders.getItems(parentFolder, {fields: 'name,shared_link,permissions,collections,sync_state'}, function (err, data) {
    if (data == null || data.entries == null) return '';
    var items = [];
    for (var f  in data.entries) {
      var item = data.entries[f];
      if (item.type!=='folder') continue;
      if (item.name===folderName){
        // folder already exists, just return the ID
        res.json({folderId: item.id});
        return;
      }
    }

    // create folder
    box.folders.create(parentFolder, folderName, function(err, data){
      res.json({folderId: data.id});
      return;
    });
  });

});

router.post('/api/storage/transferTo', jsonParser, function (req, res) {
  var token = new Credentials(req.session);
  if (token.getStorageCredentials() === undefined || token.getForgeCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  utility.assertIsVersion(req.body.autodeskItem, req, function (autodeskVersionId) {
    utility.getVersion(autodeskVersionId, req, function (version) {
      var storageFolder = req.body.storageFolder;

      var source = {
        url: version.relationships.storage.meta.link.href,
        method: "GET",
        headers: {
          'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
        },
        encoding: null
      };


      var destination = {
        url: 'https://upload.box.com/api/2.0/files/content',
        method: 'POST',
        credentials: {
          'ClientID': config.storage.credentials.client_id,
          'ClientSecret': config.storage.credentials.client_secret,
          'Authorization': token.getStorageCredentials().accessToken
        },
        file: {
          'attributes': {
            'name': version.attributes.displayName,
            'parent': {id: storageFolder}
          }
        },
        encoding: null
      };

      // send Lambda job
      var id = utility.postLambdaJob(source, destination, token);


      res.json({taskId: id, status: utility.TRANSFER_STATUS.RECEIVED});
    });
  })
  ;
})
;

router.post('/api/storage/transferFrom', jsonParser, function (req, res) {
  // >>>
  var token = new Credentials(req.session);
  if (token.getStorageCredentials() === undefined || token.getForgeCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  utility.assertIsFolder(req.body.autodeskFolder, req, function (autodeskProjectId, autodeskFolderId) {
    //<<<

    var boxAccessToken = token.getStorageCredentials().accessToken;
    var boxFileId = req.body.storageItem;
    var sdk = new BoxSDK({
      clientID: config.storage.credentials.client_id, // required
      clientSecret: config.storage.credentials.client_secret // required
    });
    var box = sdk.getBasicClient(boxAccessToken);

    box.files.get(boxFileId, null, function (err, fileInfo) {
      var fileName = fileInfo.name;

      // >>>
      utility.prepareAutodeskStorage(autodeskProjectId, autodeskFolderId, fileName, req, function (autodeskStorageUrl, skip, callbackData) {
        if (skip) {
          res.status(409).end(); // no action (server-side)
          return;
        }
        //<<<

        var source = {
          url: 'https://api.box.com/2.0/files/' + boxFileId + '/content',
          method: "GET",
          headers: {
            'Authorization': 'Bearer ' + boxAccessToken
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