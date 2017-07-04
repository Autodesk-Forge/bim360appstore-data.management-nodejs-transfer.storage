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

// forge oAuth package
var forgeSDK = require('forge-apis');

module.exports = {
  assertIsVersion: function (autodeskItem, req, callback) {
    if (autodeskItem.indexOf('/versions/') > -1) {
      // already a version, just return
      callback(autodeskItem);
      return;
    }

    if (autodeskItem.indexOf('/items/') == -1) {
      console.log('Invalid item: ' + autodeskItem);
      return;
    }

    var params = autodeskItem.split('/');
    var itemId = params[params.length - 1];
    var projectId = params[params.length - 3];

    var token = new Credentials(req.session);
    var forge3legged = new forgeSDK.AuthClientThreeLegged(
      config.forge.credentials.client_id,
      config.forge.credentials.client_secret,
      config.forge.callbackURL,
      config.forge.scope,
      true);

    var items = new forgeSDK.ItemsApi();
    items.getItemVersions(projectId, itemId, {}, forge3legged, token.getForgeCredentials())
      .then(function (versions) {
        var moment = require('moment');
        var lastVersionId;
        var newestVersion = moment('2000-01-01');

        versions.body.data.forEach(function (version) {
          var versionDate = moment(version.attributes.lastModifiedTime);
          if (versionDate.isAfter(newestVersion)) {
            newestVersion = versionDate;
            lastVersionId = version.links.self.href;
          }
        });
        callback(lastVersionId);
      })
      .catch(function (error) {

      });
  },

  getVersion: function (versionUrl, req, callback) {
    var params = decodeURIComponent(versionUrl).split('/');
    var projectId = params[params.length - 3];
    var versionId = params[params.length - 1];

    var token = new Credentials(req.session);
    var forge3legged = new forgeSDK.AuthClientThreeLegged(
      config.forge.credentials.client_id,
      config.forge.credentials.client_secret,
      config.forge.callbackURL,
      config.forge.scope,
      true);

    var versions = new forgeSDK.VersionsApi();
    versions.getVersion(projectId, versionId, forge3legged, token.getForgeCredentials())
      .then(function (version) {
        if (!version.body.data.relationships.storage || !version.body.data.relationships.storage.meta.link.href) {
          return;
        }
        callback(version.body.data)
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  postLambdaJob: function (sourceReq, destinationReq, token) {
    var newTaskId = guid();
    var request = require('request');
    request({
      url: config.transfer.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        //'Authorization': // lambda headers
      },
      rejectUnhauthorized: false, // required on httpS://localhost
      body: JSON.stringify({autodeskId: token.getAutodeskId(), taskId: newTaskId, source: sourceReq, destination: destinationReq})
    }, function (error, response) {
      // job received by Lambda
      // any error?
      // if a token is available, then notify caller
      if (token) {
        var connectedUser = io.sockets.in(token.getAutodeskId());
        if (connectedUser != null)
          connectedUser.emit('taskStatus', {
            taskId: newTaskId,
            status: 'started'
          });
      }
    });
    return newTaskId;
  }
};

//as per https://stackoverflow.com/a/105074/4838205
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + s4() + +s4() + s4() + s4() + s4() + s4();
}