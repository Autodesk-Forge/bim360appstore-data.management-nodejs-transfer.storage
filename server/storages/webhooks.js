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

// web framework
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var request = require('request');

// app config settings
var config = require('./../config');
// token handling in session
var Credentials = require('./../credentials');

// forge oAuth package
var forgeSDK = require('forge-apis');

router.post('/api/sync/setup', jsonParser, function (req, res) {
  var token = new Credentials(req.session);

  var params = req.body.autodeskFolderId.split('/');
  var autodeskFolderId = params[params.length - 1]; // source folder ID
  var storageFolderId = req.body.storageFolderId; // destination folder ID
  var storageName = config.storage.name; // storage destination name
  var autodeskId = token.getAutodeskId(); // user ID that owns this hook (linked to respective refresh tokens)

  var events = [
    'fs.file.added',
    //'fs.file.modified',
    //'fs.file.deleted',
    //'fs.file.moved',
    //'fs.file.copied',
    //'fs.folder.added',
    //'fs.folder.modified',
    //'fs.folder.deleted',
    //'fs.folder.moved',
    //'fs.folder.copied'
  ];

  // build a callback URL with the information we need:
  // user + storage destination name + storage destination folder
  var host = 'https://bdcf96f6.ngrok.io';
  var callbackURL = host + '/api/sync/callback/' + autodeskId + '/' + storageName + '/' + storageFolderId;

  // create one hook for each event
  events.forEach(function (event) {
    var webhookURL = 'https://developer-stg.api.autodesk.com/webhooks-dev/v1/systems/adsk.wipqa/events/' + event + '/hooks';

    request.get({
      url: webhookURL + '?scope={' + autodeskFolderId + '}',
      headers: {
        'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
      },
      body: JSON.stringify(body)
    }, function (error, response) {
      console.log('GET: ' + response.body);
    });

    var body = {
      callbackUrl: callbackURL,
      scope: {
        folder: autodeskFolderId
      }
    };

    console.log('Calling ' + webhookURL);
    console.log('Body ' + JSON.stringify(body))
    request.post({
      url: webhookURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
      },
      body: JSON.stringify(body)
    }, function (error, response) {
      console.log('POST: ' + response.body);
    });
  });


  res.status(200).end();
});

router.post('/api/sync/callback/*', jsonParser, function (req, res) {
  var params = req.url.split('/');
  var autodeskId = params[params.length - 3];
  var storageName = params[params.length - 2];
  var starageFolderId = params[params.length - 1];

  console.log('For user ' + autodeskId + ', transfer files to ' + storageName + ':' + starageFolderId);

  console.log(req.body);

  res.status(200).end();
});

module.exports = router;