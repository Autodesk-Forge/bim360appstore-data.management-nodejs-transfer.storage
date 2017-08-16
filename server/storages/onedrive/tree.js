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

// OneDrive SDK
const msGraph = require("@microsoft/microsoft-graph-client").Client

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

  var id = decodeURIComponent(req.query.id)

  // item id's look like this:
  // <drive id>!<file id> in case of a "personal" drive
  // e.g. BF0BDCFE22A2EFD6!161
  // however the "documentLibrary" drive is different
  // so let's store the drive id in each item's id like this
  // driveId:itemId
  var idParts = id.split(':')
  var driveId = idParts[0]
  var id = idParts[1]
  var path = ''

  try {
    if (driveId === '#') {
      path = '/drives'
    } else if (!id) {
      path = '/drives/' + driveId + '/root/children'
    } else {
      path = '/drives/' + driveId + '/items/' + id + '/children'
    }

    var msGraphClient = msGraph.init({
      defaultVersion: 'v1.0',
      debugLogging: true,
      authProvider: function (done) {
        done(null, credentials.access_token)
      }
    })

    msGraphClient
      .api(path)
      .get(function (error, data) {
        if (error) {
          console.log(error)
          respondWithError(res, error)
          return
        }

        var treeList = []
        // If the user has only one drive then just list the content
        if (driveId === '#' && data.value.length === 1) {
          driveId = data.value[0].id
          msGraphClient
            .api('/drives/' + driveId + '/root/children')
            .get(function (error, data) {
              if (error) {
                console.log(error)
                respondWithError(res, error)
                return
              }

              for (var key in data.value) {
                var item = data.value[key]
                var treeItem = {
                  id: driveId + ":" + item.id,
                  text: item.name,
                  type: item.folder ? 'folders' : 'items',
                  children: item.folder ? !!item.folder.childCount : false
                  // !! turns an object into boolean
                }

                treeList.push(treeItem)
              }

              res.json(treeList)
            })
        } else {
          for (var key in data.value) {
            var item = data.value[key]
            var treeItem = {
              id: item.id,
              text: item.name,
              type: item.folder ? 'folders' : 'items',
              children: item.folder ? !!item.folder.childCount : false
              // !! turns an object into boolean
            }

            // In case we are listing the drives
            if (driveId === '#') {
              // dealing with differences between
              // driveType = "personal" vs "documentLibrary" drives
              if (!treeItem.text)
                treeItem.text = item.id

              treeItem.type = 'drives'
              treeItem.children = true
            } else {
              treeItem.id = driveId + ":" + treeItem.id
            }
            treeList.push(treeItem)
          }

          res.json(treeList)
        }
      })
  } catch (err) {
    respondWithError(res, err)
  }
});

module.exports = router;