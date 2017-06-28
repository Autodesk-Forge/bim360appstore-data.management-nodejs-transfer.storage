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
        getProjects(resourceId, forge3legged, token.getForgeCredentials(), res);
        break;
      case 'projects':
        // for a project, first we need the top/root folder
        var hubId = params[params.length - 3];
        var projects = new forgeSDK.ProjectsApi();
        projects.getProject(hubId, resourceId/*project_id*/, forge3legged, token.getForgeCredentials())
          .then(function (project) {
            var rootFolderId = project.body.data.relationships.rootFolder.data.id;
            getFolder(resourceId/*projectId*/, rootFolderId, forge3legged, token.getForgeCredentials(), res);
          })
          .catch(function (error) {
            console.log(error);
            res.status(500).end();
          });
        break;
      case 'folders':
        var projectId = params[params.length - 3];
        getFolder(projectId, resourceId, forge3legged, token.getForgeCredentials(), res);
        break;
      case 'items':
        var projectId = params[params.length - 3];
        getVersions(projectId, resourceId, forge3legged, token.getForgeCredentials(), res);
        break;
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
            hubType = "personalHub";
            break;
          case "hubs:autodesk.bim360:Account":
            hubType = "bim360Hubs";
            break;
        }

        hubsForTree.push(prepareItemForTree(
          hub.links.self.href,
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

function getProjects(hubId, oauthClient, credentials, res) {
  var projects = new forgeSDK.ProjectsApi();

  projects.getHubProjects(hubId, {}, oauthClient, credentials)
    .then(function (projects) {
      var projectsForTree = [];
      projects.body.data.forEach(function (project) {
        var projectType = 'projects';
        switch (project.attributes.extension.type) {
          case 'projects:autodesk.core:Project':
            projectType = 'a360projects';
            break;
          case 'projects:autodesk.bim360:Project':
            projectType = 'bim360projects';
            break;
        }

        projectsForTree.push(prepareItemForTree(
          project.links.self.href,
          project.attributes.name,
          projectType,
          true
        ));
      });
      res.json(projectsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    });
}

function getFolder(projectId, folderId, oauthClient, credentials, res) {
  var folders = new forgeSDK.FoldersApi();
  folders.getFolderContents(projectId, folderId, {}, oauthClient, credentials)
    .then(function (folderContents) {
      var folderItemsForTree = [];
      folderContents.body.data.forEach(function (item) {
        folderItemsForTree.push(prepareItemForTree(
          item.links.self.href,
          item.attributes.displayName == null ? item.attributes.name : item.attributes.displayName,
          item.type,
          true
        ))
      });
      res.json(folderItemsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    });
}

function getVersions(projectId, itemId, oauthClient, credentials, res) {
  var items = new forgeSDK.ItemsApi();
  items.getItemVersions(projectId, itemId, {}, oauthClient, credentials)
    .then(function (versions) {
      var versionsForTree = [];
      versions.body.data.forEach(function (version) {
        var moment = require('moment');
        var lastModifiedTime = moment(version.attributes.lastModifiedTime);
        var days = moment().diff(lastModifiedTime, 'days')
        var dateFormated = (versions.body.data.length > 1 || days > 7 ? lastModifiedTime.format('MMM D, YYYY, h:mm a') : lastModifiedTime.fromNow());
        versionsForTree.push(prepareItemForTree(
          version.links.self.href,
          dateFormated + ' by ' + version.attributes.lastModifiedUserName,
          'versions',
          false
        ));
      });
      res.json(versionsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    })
}

function prepareItemForTree(_id, _text, _type, _children) {
  return {id: _id, text: _text, type: _type, children: _children};
}

module.exports = router;