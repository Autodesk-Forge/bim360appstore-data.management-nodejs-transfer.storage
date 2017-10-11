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
var CredentialsOffline = require('./../database/credentialsOffline');

// forge oAuth package
var forgeSDK = require('forge-apis');

router.post('/api/sync/setup', jsonParser, function (req, res) {
  var token = new Credentials(req.session);

  var params = req.body.autodeskFolderId.split('/');
  var autodeskFolderId = params[params.length - 1]; // source folder ID
  var projectId = params[params.length - 3];
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
  var host = 'https://71a346cf.ngrok.io';
  // new address https://developer-stg.api.autodesk.com/webhooks/v1/systems/adsk.wipstg/events/fs.file.added/hooks

  var callbackURL = host + '/api/sync/callback/' + autodeskId + '/' + storageName + '/' + storageFolderId;

  // create one hook for each event
  events.forEach(function (event) {
    var webhookURL = 'https://developer-stg.api.autodesk.com/webhooks/v1/systems/adsk.wipstg/events/' + event + '/hooks';

    request.get({
      url: webhookURL + '?scope=' + autodeskFolderId,
      headers: {
        'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
      },
      body: JSON.stringify(body)
    }, function (error, response) {
      //console.log('GET: ' + response.req.path + ': ' + response.body);
      if (response.statusCode != 200) return;
      if (response.body === '') return;

      var body = JSON.parse(response.body);

      body.forEach(function (hook) {
        // for this testing, let's remove all hooks...
        var deleteURL = 'https://developer-stg.api.autodesk.com/webhooks/v1' + hook.__self__; // systems/adsk.wipqa/events/'+ hook.eventType +'/hooks/' + hook.hookId;
        request({
          url: deleteURL,
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
          }
        }, function (error, response) {
          console.log('DELETE ' + deleteURL + ': ' + response.statusCode);
        })
      })
    });

    var body = {
      callbackUrl: callbackURL,
      scope: {
        folder: autodeskFolderId
      },
      hookAttribute: {
        projectId: projectId
      }
    };

    request.post({
      url: webhookURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.getForgeCredentials().access_token
      },
      body: JSON.stringify(body)
    }, function (error, response) {
      console.log('POST ' + webhookURL + ': ' + response.statusCode);
    });
  });


  res.status(200).end();
});

router.post('/api/sync/callback/*', jsonParser, function (req, res) {
  var body = req.body;
  var params = req.url.split('/');

  var autodeskId = params[params.length - 3];
  var projectId = body.hook.hookAttribute.projectId; // custom property
  var storageName = params[params.length - 2];
  var storageFolderId = params[params.length - 1];

  console.log(JSON.stringify(body));

  var twilio = require('twilio');
  var client = new twilio('', '');

  client.messages.create({
    body: 'File ' + body.payload.name + ' was added and will sync to ' + storageName,
    to: '+',  // Text this number
    from: '+' // From a valid Twilio number
  }, function(err, result) {
  });

  console.log('For user ' + autodeskId + ', transfer "' + body.payload.name + '" to ' + storageName + ':' + storageFolderId);

  var storageIntegration = require('./' + storageName + '/integration.js');
  var sourceVersion = 'https://developer.api.autodesk.com/data/v1/projects/' + projectId + '/versions/' + body.payload.source;
  var token = new CredentialsOffline(autodeskId, storageName);
  token.init(function () {
    storageIntegration.doTransferTo(token, sourceVersion, storageFolderId, function (taskId) {
      // all set
    });
  });

  res.status(200).end();
});

module.exports = router;