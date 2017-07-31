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

// app config settings
var config = require('./config');

// forge oAuth package
var forgeSDK = require('forge-apis');

router.get('/api/storageInfo', function (req, res) {
  res.json({
    'storageName': config.storage.name,
    'needsAccountName': config.storage.needsAccountName
  });
});

router.get('/api/forge/clientID', function (req, res) {
  res.json({
    'ForgeClientId': config.forge.credentials.client_id
  });
});

router.get('/api/app/logoff', function (req, res) {
  req.session = null;
  res.writeHead(301, {Location: '/'});
  res.end();
});

var utility = require('./storages/utility');

router.post('/api/app/callback/transferStatus', jsonParser, function (req, res) {
  if (req.body.data != null) {
    // if the data param comes on the callback, it means we need to
    // create the item or version as the files was trasnfered to Autodesk
    var connectedUser = io.sockets.in(req.body.autodeskId);
    if (connectedUser != null)
      connectedUser.emit('taskStatus', {
        taskId: req.body.taskId,
        status: utility.TRANSFER_STAGES.ALMOST
      });

    var data = req.body.data;
    utility.createItemOrVersion(data.fileName, data.projectId, data.folderId, data.objectId, data.credentials, function () {
      var connectedUser = io.sockets.in(req.body.autodeskId);
      if (connectedUser != null)
        connectedUser.emit('taskStatus', {
          taskId: req.body.taskId,
          status: utility.TRANSFER_STAGES.COMPLETED,
          tree: 'autodesk'
        });
    });
  }
  else {
    var connectedUser = io.sockets.in(req.body.autodeskId);
    if (connectedUser != null)
      connectedUser.emit('taskStatus', {
        taskId: req.body.taskId,
        status: req.body.status, // number comming from LAMBDA
        tree: 'storage'
      });
  }
  res.status(200).end();
});

module.exports = router;