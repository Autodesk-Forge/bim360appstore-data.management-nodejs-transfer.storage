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

var request = require('request');

// OneDrive SDK
const msGraph = require("@microsoft/microsoft-graph-client").Client;

var cryptiles = require('cryptiles');

// entity type encoder
var Encoder = require('node-html-encoder').Encoder;
var encoder = new Encoder('entity');

function respondWithError(res, error) {
  if (error.statusCode) {
    res.status(error.statusCode).end(error.statusMessage)
  } else {
    res.status(500).end(error.message)
  }
}

router.get('/api/storage/signin', function (req, res) {
  req.session.csrf = cryptiles.randomString(24);

  var url =
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' +
    'client_id=' + config.storage.credentials.client_id +
    '&redirect_uri=' + config.storage.callbackURL +
    '&scope=user.read%20files.readwrite%20files.readwrite.all%20sites.read.all%20sites.readwrite.all' +
    '&state=' + req.session.csrf +
    '&response_type=code'
  res.end(url)
});

// the callback endpoint should have the storage name (exception)
router.get('/api/onedrive/callback/oauth', function (req, res) {
  var csrf = req.query.state;
  if (csrf !== req.session.csrf) {
    res.status(401).end();
    return;
  }

  var code = req.query.code

  request({
    url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
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
      console.log(error)  // connection problems
      if (body.errors != null)
        console.log(body.errors)

      respondWithError(res, error)
      return
    }

    var json = JSON.parse(body);

    if (json.error!=null) {
      respondWithError(res, json.error)
      return;
    }

    var token = new Credentials(req.session);
    token.setStorageCredentials(json);

    res.redirect('/')
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

  var msGraphClient = msGraph.init({
    defaultVersion: 'v1.0',
    debugLogging: true,
    authProvider: function (done) {
      done(null, credentials.access_token)
    }
  })

  msGraphClient
    .api('/me')
    //.select("displayName")
    //.select("mySite")
    .get(function (error, data) {
      if (error) {
        console.log(error)
        respondWithError(data, error)
        return
      }

      // This works for personal accounts
      var profile = {
        'name': encoder.htmlEncode(data.displayName),
        'picture': 'https://apis.live.net/v5.0/' + data.id + '/picture?type=small'
      }
      res.json(profile)
    })
});

module.exports = router;
