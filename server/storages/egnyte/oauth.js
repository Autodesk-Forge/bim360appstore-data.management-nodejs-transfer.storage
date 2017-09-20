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

var request = require('request')

var egnyteSDK = require('egnyte-js-sdk');

var cryptiles = require('cryptiles');

function respondWithError(res, error) {
  if (error.statusCode) {
    res.status(error.statusCode).end(error.statusMessage)
  } else {
    res.status(500).end(error.message)
  }
}

router.get('/api/storage/signin', function (req, res) {
  req.session.csrf = cryptiles.randomString(24);
  req.session.egnyteURL = "https://" + req.query.accountName + ".egnyte.com";

  var url =
    req.session.egnyteURL + '/puboauth/token?' +
    'client_id=' + config.storage.credentials.client_id +
    '&redirect_uri=' + config.storage.callbackURL +
    '&scope=Egnyte.filesystem' +
    '&state=' + req.session.csrf +
    '&response_type=code'
  res.end(url);
});

// the callback endpoint should have the storage name (exception)
router.get('/api/egnyte/callback/oauth', function (req, res) {
  var csrf = req.query.state;
  if (csrf !== req.session.csrf) {
    res.status(401).end();
    return;
  }

  var code = req.query.code

  request({
    url: req.session.egnyteURL + "/puboauth/token",
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'client_id=' + config.storage.credentials.client_id +
    '&client_secret=' + config.storage.credentials.client_secret +
    '&redirect_uri=' + config.storage.callbackURL +
    '&code=' + code +
    '&grant_type=authorization_code'
  }, function (error, response, body) {
    if (error != null) {
      console.log(error); // connection problems

      if (body.errors != null)
        console.log(body.errors);

      respondWithError(res, error);

      return;
    }

    var json = JSON.parse(body)
    var token = new Credentials(req.session);
    token.setStorageCredentials(json);

    res.redirect('/');
  })
});

// returns {name, picture}
router.get('/api/storage/profile', function (req, res) {
  var token = new Credentials(req.session);
  var credentials = token.getStorageCredentials();

  if (credentials === undefined) {
    res.status(401).end();
    return;
  }

  var egnyte = egnyteSDK.init(req.session.egnyteURL, {
    token: credentials.access_token
  });

  egnyte.API.auth.getUserInfo()
    .then(function (data) {
      var profile = {
        'name': data.first_name + ' ' + data.last_name,
        'picture': ""
      };
      res.json(profile);
    })
    .catch(function (error) {
      console.log(error);
      respondWithError(res, error);
    });
});

module.exports = router;
