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
// box sdk: https://github.com/box/box-node-sdk/
var BoxSDK = require('box-node-sdk');

var cryptiles = require('cryptiles');

// entity type encoder
var Encoder = require('node-html-encoder').Encoder;
var encoder = new Encoder('entity');

router.get('/api/storage/signin', function (req, res) {
  req.session.csrf = cryptiles.randomString(24);
  var url =
    'https://account.box.com/api/oauth2/authorize?response_type=code&' +
    '&client_id=' + config.storage.credentials.client_id +
    '&redirect_uri=' + config.storage.callbackURL.toLowerCase() +
    '&state=' + req.session.csrf;
  res.end(url);
});

// the callback endpoint should have the storage name (exception)
router.get('/api/box/callback/oauth', function (req, res) {
  var csrf = req.query.state;
  if (csrf !== req.session.csrf) {
    res.status(401).end();
    return;
  }

  var code = req.query.code;
  var sdk = new BoxSDK({
    clientID: config.storage.credentials.client_id, // required
    clientSecret: config.storage.credentials.client_secret // required
  });

  sdk.getTokensAuthorizationCodeGrant(code, null, function (err, tokenInfo) {
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

  var sdk = new BoxSDK({
    clientID: config.storage.credentials.client_id, // required
    clientSecret: config.storage.credentials.client_secret // required
  });

  var box = sdk.getBasicClient(credentials.accessToken);
  box.users.get(box.users.CURRENT_USER_ID, null, function (err, user) {
    if (err) {
      console.log(err);
      res.status(500);
      return;
    }
    res.json({
      name: encoder.htmlEncode(user.name),
      picture: user.avatar_url
    });
  })
});

module.exports = router;
