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

var googleSdk = require('googleapis');

var request = require('request');

var utility = require('./../utility');

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

      // Google API first need to create an entry, then upload
      request({
        url: 'https://www.googleapis.com/drive/v3/files',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.getStorageCredentials().access_token
        },
        body: JSON.stringify({
          name: version.attributes.displayName,
          parents: [storageFolder]
        })
      }, function (error, response, file) {
        var newFile = JSON.parse(response.body);

        // now with the file created, let's prepare the transfer job\
        var source = {
          url: version.relationships.storage.meta.link.href,
          method: "GET",
          headers: {
            'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
          },
          encoding: null
        };

        var destination = {
          url: 'https://www.googleapis.com/upload/drive/v2/files/' + newFile.id + '?uploadType=media',
          method: 'PUT',
          headers: {
            'Content-Type': newFile.mimeType,
            'Authorization': 'Bearer ' + token.getStorageCredentials().access_token
          }
        };

        // send Lambda job
        utility.postLambdaJob(source, destination);
      });


      // ToDo
      res.status(200).end();
    });
  });
});


module.exports = router;