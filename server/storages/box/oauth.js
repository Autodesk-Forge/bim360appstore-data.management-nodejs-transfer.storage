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

router.get('/api/storage/signin', function (req, res) {
  var url =
    'https://account.box.com/api/oauth2/authorize?response_type=code&' +
    '&client_id=' + config.storage.credentials.client_id +
    '&redirect_uri=' + config.storage.callbackURL.toLowerCase() +
    '&state=autodeskforge';
  res.end(url);
});

// the callback endpoint should have the storage name (exception)
router.get('/api/box/callback/oauth', function (req, res) {
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

router.get('/api/storage/profile', function (req, res) {
  var token = new Credentials(req.session);

  var sdk = new BoxSDK({
    clientID: config.storage.credentials.client_id, // required
    clientSecret: config.storage.credentials.client_secret // required
  });

  var box = sdk.getBasicClient(token.getStorageCredentials().accessToken);
  box.users.get(box.users.CURRENT_USER_ID,null, function(err, user){
    if (err){
      console.log(err);
      res.status(500);
      return;
    }
    res.json({
      name: user.name,
      picture: user.avatar_url
    });
  })
});

module.exports = router;
