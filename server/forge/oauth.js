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
var Credentials = require('./../credentials');
// forge config information, such as client ID and secret
var config = require('./../config');

// web framework
var express = require('express');
var router = express.Router();
// forge oAuth package
var forgeSDK = require('forge-apis');


router.get('/api/forge/signin', function (req, res) {
  var url =
    "https://developer.api.autodesk.com" +
    '/authentication/v1/authorize?response_type=code' +
    '&client_id=' + config.forge.credentials.client_id +
    '&redirect_uri=' + config.forge.callbackURL +
    '&scope=' + config.forge.scope.join(" ");
  res.end(url);
});

// OAuth callback from Autodesk Forge
router.get('/api/forge/callback/oauth', function (req, res) {
  var token = new Credentials(req.session);

  var code = req.query.code;
  var forge3legged = new forgeSDK.AuthClientThreeLegged(
    config.forge.credentials.client_id,
    config.forge.credentials.client_secret,
    config.forge.callbackURL,
    config.forge.scope);

  forge3legged.getToken(code).then(function (credentials) {
    token.setForgeCredentials(credentials);
    res.redirect('/')
  }).catch(function (err) {
    console.log(err);
    res.redirect('/')
  })
});

router.get('/api/forge/profile', function (req, res) {
  var token = new Credentials(req.session);
  var credentials = token.getForgeCredentials();
  if (credentials === undefined) {
    res.status(401).end();
    return;
  }

  var forge3legged = new forgeSDK.AuthClientThreeLegged(
    config.forge.credentials.client_id,
    config.forge.credentials.client_secret,
    config.forge.callbackURL,
    config.forge.scope,
    true);

  var user = new forgeSDK.UserProfileApi();
  user.getUserProfile(forge3legged, token.getForgeCredentials())
    .then(function (profile) {
      token.setAutodeskId(profile.body.userId);
      res.json({
        name: profile.body.firstName + ' ' + profile.body.lastName,
        picture: profile.body.profileImages.sizeX40,
        id: profile.body.userId
      });
    })
    .catch(function (error) {
      console.log(error);
      res.status(401).end()
    })
});

module.exports = router;