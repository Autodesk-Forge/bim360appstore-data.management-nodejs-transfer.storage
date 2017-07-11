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
      var onedriveDriveId = storageFolder.split('!')[0]
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

      res.json({taskId: id, status: 'received'});
    });
  });
});

module.exports = router;