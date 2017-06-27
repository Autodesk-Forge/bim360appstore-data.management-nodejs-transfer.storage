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
// google drive sdk: https://developers.google.com/drive/v3/web/quickstart/nodejs
var googleSdk = require('googleapis');

router.get('/api/storage/signin', function (req, res) {
  var oauth2Client = new googleSdk.auth.OAuth2(
    config.storage.credentials.client_id,
    config.storage.credentials.client_secret,
    config.storage.callbackURL);

  var scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
    scope: config.storage.scope.split(',')  // If you only need one scope you can pass it as string
  });
  res.end(url);
});

// the callback endpoint should have the storage name (exception)
router.get('/api/google/callback/oauth', function (req, res) {
  var code = req.query.code;

  var oauth2Client = new googleSdk.auth.OAuth2(
    config.storage.credentials.client_id,
    config.storage.credentials.client_secret,
    config.storage.callbackURL);
  oauth2Client.getToken(code, function (err, tokenInfo) {
    if (err) {
      res.end(JSON.stringify(err));
      return;
    }
    var token = new Credentials(req.session);
    token.setStorageCredentials(tokenInfo);
    res.redirect('/');
  });
});

// returns {name, picture}
router.get('/api/storage/profile', function (req, res) {
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

  var plus = googleSdk.plus('v1');
  plus.people.get({userId: 'me', auth: oauth2Client}, function (err, user) {
    if (err) {
      console.log(err);
      res.status(500);
      return;
    }
    res.json({
      name: user.displayName,
      picture: user.image.url
    });
  });


});

module.exports = router;
