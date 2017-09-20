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

var egnyteSDK = require('egnyte-js-sdk');

function respondWithError(res, error) {
  if (error.statusCode) {
    res.status(error.statusCode).end(error.statusMessage)
  } else {
    res.status(500).end(error.message)
  }
}

router.get('/api/storage/tree', function (req, res) {
  var token = new Credentials(req.session);
  var credentials = token.getStorageCredentials();
  if (credentials === undefined) {
    res.status(401).end();
    return;
  }

  var egnyte = egnyteSDK.init(req.session.egnyteURL, {
    token: credentials.access_token
  });

  try {
    var path = req.query.id === '#' ? '/' : req.query.id;
    var pathInfo = egnyte.API.storage.path(path);
    pathInfo.get()
      .then(function (data) {
        var result = prepareArraysForJSTree(data.folders, data.files);
        res.end(result);
      })
      .catch(function (error) {
        respondWithError(res, error);
      });
  } catch (err) {
    respondWithError(res, err)
  }
});

// Formats a list to JSTree structure
function prepareArraysForJSTree(folders, files) {
  var treeList = [];

  if (folders) {
    folders.forEach(function (item, index) {
      //console.log(item);
      var treeItem = {
        id: item.path,
        text: encoder.htmlEncode(item.name),
        type: item.is_folder ? 'folders' : 'items',
        children: item.is_folder
      };
      treeList.push(treeItem);
    });
  }

  if (files) {
    files.forEach(function (item, index) {
      //console.log(item);
      var treeItem = {
        id: item.path,
        text: item.name,
        type: item.is_folder ? 'folders' : 'items',
        children: item.is_folder
      };
      treeList.push(treeItem);
    });
  }

  return JSON.stringify(treeList);
}

module.exports = router;