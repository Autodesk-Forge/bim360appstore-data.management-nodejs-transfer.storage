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

var Dropbox = require('dropbox');

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

  var id = decodeURIComponent(req.query.id);

  // item id's look like this:
  // <drive id>!<file id>
  // e.g. BF0BDCFE22A2EFD6!161
  var driveId = id.split('!')[0];
  var path = '';

  try {
    if (id === '#') {
      path = ''
    } else {
      path = encoder.htmlDecode(id);
    }

    var dbx = new Dropbox({ accessToken: credentials.access_token })

    dbx.filesListFolder({path: path})
      .then(function (data) {

        var treeList = [];
        for (var key in data.entries) {
          var item = data.entries[key]
          var treeItem = {
            id: encoder.htmlEncode(item.path_display),
            text: encoder.htmlEncode(item.name),
            type: item['.tag'] === 'folder' ? 'folders' : 'items',
            children: item['.tag'] === 'folder' ? true : false
            // !! turns an object into boolean
          }

          treeList.push(treeItem)
        }

        res.json(treeList)
      })
      .catch(function (error) {
        console.log(error)
        respondWithError(res, error)
        return
      })
  } catch (err) {
    respondWithError(res, err)
  }
});

module.exports = router;