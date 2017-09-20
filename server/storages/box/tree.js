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

// entity type encoder
var Encoder = require('node-html-encoder').Encoder;
var encoder = new Encoder('entity');

// web framework
var express = require('express');
var router = express.Router();
// box sdk: https://github.com/box/box-node-sdk/
var BoxSDK = require('box-node-sdk');

router.get('/api/storage/tree', function (req, res) {
  var token = new Credentials(req.session);
  var credentials = token.getStorageCredentials();
  if (credentials === undefined) {
    res.status(401).end();
    return;
  }

  var sdk = new BoxSDK({
    clientID: config.storage.credentials.client_id, // required
    clientSecret: config.storage.credentials.client_secret // required
  });

  var box = sdk.getBasicClient(credentials.accessToken);
  var id = (req.query.id === '#' ? '0' : req.query.id);

  box.folders.getItems(id, {fields: 'name,shared_link,permissions,collections,sync_state', limit: 1000}, function (err, data) {
    if (data == null || data.entries == null) return '';
    var items = [];
    data.entries.forEach(function (item, index) {
      var item = {
        id: item.id,
        text: encoder.htmlEncode(item.name),
        type: item.type,
        children: (item.type === 'folder')
      };
      if (item.type === 'folder') item.type = 'folders';// required for the common ground
      items.push(item);
    });
    res.json(items);
  });
});

module.exports = router;