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
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var request = require('request');

// forge oAuth package
var forgeSDK = require('forge-apis');

router.post('/api/forge/createFolder', jsonParser, function (req, res) {
  var token = new Credentials(req.session);
  var forge3legged = new forgeSDK.AuthClientThreeLegged(
    config.forge.credentials.client_id,
    config.forge.credentials.client_secret,
    config.forge.callbackURL,
    config.forge.scope,
    true);

  if (token.getForgeCredentials() === undefined) {
    res.status(401).end();
    return;
  }

  var parentFolderHref = req.body.parentFolder;
  var folderName = req.body.folderName;

  var params = parentFolderHref.split('/');
  var projectId = params[params.length - 3];
  var parentFolderId = params[params.length - 1];

  var folders = new forgeSDK.FoldersApi();
  folders.getFolderContents(projectId, parentFolderId, {}, forge3legged, token.getForgeCredentials())
    .then(function (folderContents) {
      for (var f  in folderContents.body.data) {
        var item = folderContents.body.data[f];
        if (item.type === 'folders' && item.attributes.displayName === folderName) {
          res.json({folderId: item.links.self.href});
          return;
        }
      }

      if (projectId.indexOf('b.') > -1) {
        // BIM 360 Docs project
        var createFolder = {
          url: 'https://developer.api.autodesk.com/data/v1/projects/' + projectId + '/commands',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token.getForgeCredentials().access_token,
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify(createBIM360FolderSpecData(folderName, parentFolderId))
        };

        request(createFolder, function (error, response) {
          if (error) {
            if (process.env.CONSOLELOG) console.log(error);
            res.status(500).end();
            return;
          }
          var body = JSON.parse(response.body);

          if (body.errors && body.errors.length > 0) {
            if (process.env.CONSOLELOG) console.log(body.errors);
            res.status(500).end();
            return;
          }

          // create folder for BIM 360 Docs returns ONLY the folder ID, but our UI uses the full Href
          res.json({folderId: 'https://developer.api.autodesk.com/data/v1/projects/' + projectId + '/folders/' + body.data.relationships.created.data[0].id});
        });
      }
      else {
        // other project type (e.g. BIM 360 Team)
        folders.postFolder(projectId, createFolderSpecData(folderName, parentFolderId), forge3legged, token.getForgeCredentials())
          .then(function (folder) {
            res.json({folderId: folder.body.data.links.self.href});
          })
          .catch(function (error) {
            console.log(error);
            res.status(500).end();
          })
      }
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    });
});

function createFolderSpecData(folderName, parentFolderId) {
  return {
    jsonapi: {
      version: "1.0"
    },
    data: {
      type: "folders",
      attributes: {
        name: folderName,
        extension: {
          type: "folders:autodesk.core:Folder",
          version: "1.0"
        }
      },
      relationships: {
        parent: {
          data: {
            type: "folders",
            id: parentFolderId
          }
        }
      }
    }
  }
}

function createBIM360FolderSpecData(folderName, parentFolderId) {
  return {
    jsonapi: {
      "version": "1.0"
    },
    data: {
      type: "commands",
      attributes: {
        extension: {
          type: "commands:autodesk.core:CreateFolder",
          version: "1.0.0",
        }
      },
      relationships: {
        resources: {
          data: [
            {
              type: "folders",
              id: "1"
            }
          ]
        }
      }
    },
    included: [{
      type: "folders",
      id: "1",
      attributes: {
        name: folderName,
        extension: {
          type: "folders:autodesk.bim360:Folder",
          version: "1.0"
        }
      },
      relationships: {
        parent: {
          data: {
            type: "folders",
            id: parentFolderId
          }
        }
      }
    }
    ]
  }
}

module.exports = router;