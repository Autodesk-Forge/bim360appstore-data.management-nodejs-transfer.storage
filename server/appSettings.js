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

router.get('/api/storageInfo', function (req, res) {
  res.json({
    'storageName': config.storage.name,
    'needsAccountName': config.storage.needsAccountName
  });
});

router.post('/api/app/callback/transferStatus', jsonParser, function (req, res) {
  var connectedUser = io.sockets.in(req.body.autodeskId);
  if (connectedUser != null)
    connectedUser.emit('taskStatus', {
      taskId: req.body.taskId,
      status: 'completed'
    });
});

module.exports = router;