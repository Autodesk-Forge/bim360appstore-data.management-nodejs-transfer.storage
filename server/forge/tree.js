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

function respondWithError(res, error) {
  if (error.statusCode) {
    res.status(error.statusCode).end(error.statusMessage);
  } else {
    res.status(500).end(error.message);
  }
}

router.get('/api/forge/tree', function (req, res) {
  var token = new Credentials(req.session);
  var forge3legged = new forgeSDK.AuthClientThreeLegged(
    config.forge.credentials.client_id,
    config.forge.credentials.client_secret,
    config.forge.callbackURL,
    config.forge.scope);

  var href = decodeURIComponent(req.query.id);
  if (href === '') {
    res.status(500).end();
    return;
  }
  if (href === '#') {
    getHubs(forge3legged, token.getForgeCredentials(), res);
  }
  else {
    var params = href.split('/');
    var resourceName = params[params.length - 2];
    var resourceId = params[params.length - 1];
    switch (resourceName) {
      case 'hubs':
        // if the caller is a hub, then show projects
        var projects = new forgeSDK.ProjectsApi();

        projects.getHubProjects(resourceId/*hub_id*/, {},
          forge3legged, token.getForgeCredentials())
          .then(function (projects) {
            res.json(prepareArrayForJSTree(projects.body.data, true));
          })
          .catch(function (error) {
            console.log(error);
            respondWithError(res, error);
          });
        break;
      case 'projects':
        // if the caller is a project, then show folders
        var hubId = params[params.length - 3];
        var projects = new forgeSDK.ProjectsApi();
        projects.getProject(hubId, resourceId/*project_id*/,
          forge3legged, token.getForgeCredentials())
          .then(function (project) {
            var rootFolderId = project.body.data.relationships.rootFolder.data.id;
            var folders = new forgeSDK.FoldersApi();
            folders.getFolderContents(resourceId, rootFolderId, {},
              forge3legged, token.getForgeCredentials())
              .then(function (folderContents) {
                res.json(prepareArrayForJSTree(folderContents.body.data, true));
              })
              .catch(function (error) {
                console.log(error);
                respondWithError(res, error);
              });
          })
          .catch(function (error) {
            console.log(error);
            respondWithError(res, error);
          });
        break;
      case 'folders':
        // if the caller is a folder, then show contents
        var projectId = params[params.length - 3];
        var folders = new forgeSDK.FoldersApi();
        folders.getFolderContents(projectId, resourceId/*folder_id*/,
          {}, forge3legged, token.getForgeCredentials())
          .then(function (folderContents) {
            res.json(prepareArrayForJSTree(folderContents.body.data, true));
          })
          .catch(function (error) {
            console.log(error);
            respondWithError(res, error);
          });
        break;
      case 'items':
        // if the caller is an item, then show versions
        var projectId = params[params.length - 3];
        var items = new forgeSDK.ItemsApi();
        items.getItemVersions(projectId, resourceId/*item_id*/,
          {}, forge3legged, token.getForgeCredentials())
          .then(function (versions) {
            res.json(prepareArrayForJSTree(versions.body.data, false));
          })
          .catch(function (error) {
            console.log(error);
            respondWithError(res, error);
          });
    }
  }
});

function getHubs(oauthClient, credentials, res) {
  var hubs = new forgeSDK.HubsApi();
  hubs.getHubs({}, oauthClient, credentials)
    .then(function (data) {
      var hubsForTree = [];
      data.body.data.forEach(function (hub) {
        var hubType;

        switch (hub.attributes.extension.type) {
          case "hubs:autodesk.core:Hub":
            hubType = "hubs";
            break;
          case "hubs:autodesk.a360:PersonalHub":
            hubType = "personalhub";
            break;
          case "hubs:autodesk.bim360:Account":
            hubType = "bim360hubs";
            break;
        }

        hubsForTree.push(prepareItemForTree(
          hub.links.self.href,
          '',
          hub.attributes.name,
          hubType,
          true
        ));
      });
      res.json(hubsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    });
}

function prepareItemForTree(_id, _data, _text, _type, _children) {
  return {id: _id, text: _text, type: _type, children: _children};
}

// Formats a list to JSTree structure
function prepareArrayForJSTree(listOf, canHaveChildren, data) {
  if (listOf == null) return '';
  var treeList = [];
  listOf.forEach(function (item, index) {
    console.log(item.links.self.href);
    console.log(
      "item.attributes.displayName = " + item.attributes.displayName +
      "; item.attributes.name = " + item.attributes.name
    );
    var treeItem = {
      id: item.links.self.href,
      data: (item.relationships != null && item.relationships.derivatives != null ?
        item.relationships.derivatives.data.id : null),
      text: (item.attributes.displayName == null ? item.attributes.name : item.attributes.displayName),
      type: item.type,
      children: canHaveChildren
    };
    treeList.push(treeItem);
  });
  return treeList;
}

module.exports = router;