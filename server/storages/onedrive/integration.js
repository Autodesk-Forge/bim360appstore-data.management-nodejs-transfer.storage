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

function respondWithError(res, error) {
  if (error.statusCode) {
    res.status(error.statusCode).end(error.statusMessage)
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

  // file IDs to transfer
  var autodeskFileId = decodeURIComponent(req.body.autodeskItem);
  var onedriveFolderId = req.body.storageFolder;
  var onedriveDriveId = onedriveFolderId.split('!')[0]

  // the autodesk file id parameters should be in the form of
  // /data/v1/projects/::project_id::/versions/::version_id::
  var params = autodeskFileId.split('/');
  var projectId = params[params.length - 3];
  var versionId = params[params.length - 1];

  var forge3legged = new forgeSDK.AuthClientThreeLegged(
    config.forge.credentials.client_id,
    config.forge.credentials.client_secret,
    config.forge.callbackURL,
    config.forge.scope,
    true);

  var versions = new forgeSDK.VersionsApi();
  versions.getVersion(projectId, versionId, forge3legged, token.getForgeCredentials())
    .then(function (version) {
      if (!version.body.data.relationships.storage || !version.body.data.relationships.storage.meta.link.href) {
        res.status(500).json({error: 'No storage defined, cannot transfer.'});
        return;
      }
      var storageLocation = version.body.data.relationships.storage.meta.link.href;
      // the storage location should be in the form of
      // /oss/v2/buckets/::bucketKey::/objects/::objectName::
      params = storageLocation.split('/');
      var bucketKey = params[params.length - 3];
      var objectName = params[params.length - 1];

      //var objects = new forgeOSS.ObjectsApi();
      // npm forge-oss call to download not working
      //objects.getObject(bucketKey, objectName).then(function (file) {

      // workaround to download
      request({
        url: storageLocation,
        method: "GET",
        headers: {
          'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
        },
        encoding: null
      }, function (error, response, file) {
        if (error) {
          console.log(error);
          respondWithError(res, error);
          return;
        }
        // end of workaround

        var fileName = version.body.data.attributes.name;

        var msGraphClient = msGraph.init({
          defaultVersion: 'v1.0',
          debugLogging: true,
          authProvider: function (done) {
            done(null, credentials)
          }
        })

        msGraphClient
          .api('/drives/' + onedriveDriveId + '/items/' + onedriveFolderId + '/children/' + fileName + '/content')
          .put(file, function (error, data) {
            if (error) {
              console.log(error)
              respondWithError(data, error)
              return
            }
            res.status(200).end()
          })
      });
    })
    .catch(function (err) {
      respondWithError(res, err);
    });
});

module.exports = router;