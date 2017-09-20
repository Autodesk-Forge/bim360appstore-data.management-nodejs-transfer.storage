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
// google drive sdk: https://developers.google.com/drive/v3/web/quickstart/nodejs
var googleSdk = require('googleapis');

router.get('/api/storage/tree', function (req, res) {
  var token = new Credentials(req.session);
  var credentials = token.getStorageCredentials();
  if (credentials === undefined) {
    res.status(401).end();
    return;
  }

  var oauth2Client = new googleSdk.auth.OAuth2(
    config.storage.credentials.client_id,
    config.storage.credentials.client_secret,
    config.storage.callbackURL);
  oauth2Client.setCredentials(token.getStorageCredentials());
  var drive = googleSdk.drive({version: 'v2', auth: oauth2Client});

  var id = req.query.id;

  // google results are paginated, so it will call
  // all pages and return continuously
  res.setHeader('Content-Type', 'application/json');
  res.write('[');
  drivePage(res, drive, id, null, true);
});


function drivePage(res, drive, folderId, npToken, first) {
  drive.files.list({
    maxResults: 1000,
    q: (folderId === '#' ? '\'root\' in parents' : '\'' + folderId + '\' in parents') + ' and trashed = false',
    fields: 'nextPageToken, items(id,mimeType,title, iconLink)',
    pageToken: npToken
  }, function (err, lst) {
    if (err) console.log(err);
    var items = lst.items;

    items.forEach(function (item) {
      var treeItem = {
        id: item.id,
        data: '',
        text: encoder.htmlEncode(item.title),
        type: ((item.mimeType != 'application/vnd.google-apps.folder') ? item.mimeType.replace('application/', '') : 'folders'),
        icon: item.iconLink,
        children: (item.mimeType === 'application/vnd.google-apps.folder')
      };
      res.write((first ? '' : ',') + JSON.stringify(treeItem));
      first = false;
    });

    if (lst.nextPageToken)
      drivePage(res, drive, folderId, lst.nextPageToken, first);
    else
      res.end(']');
  });
}

module.exports = router;