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

//'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var Credentials = require('./../credentials');
// forge config information, such as client ID and secret
var config = require('./../config');

// forge oAuth package
var forgeSDK = require('forge-apis');

var request = require('request');

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

  assertIsFolder: function (autodeskFolder, req, callback) {
    var params = autodeskFolder.split('/');

    if (autodeskFolder.indexOf('/folders/') > -1) {
      // already a folder, just return
      callback(params[params.length - 3], params[params.length - 1]);
      return;
    }

    // projects have this piece of string... may need to improve this check
    if (autodeskFolder.indexOf('/project/v1/hubs/') == -1) {
      console.log('Invalid folder: ' + autodeskFolder);
      return;
    }

    var token = new Credentials(req.session);
    var forge3legged = new forgeSDK.AuthClientThreeLegged(
      config.forge.credentials.client_id,
      config.forge.credentials.client_secret,
      config.forge.callbackURL,
      config.forge.scope,
      true);

    // get the root folder of this project
    var hubId = params[params.length - 3];
    var projectId = params[params.length - 1];
    var projects = new forgeSDK.ProjectsApi();
    projects.getProject(hubId, projectId, forge3legged, token.getForgeCredentials())
      .then(function (project) {
        var rootFolderId = project.body.data.relationships.rootFolder.data.id;
        callback(projectId, rootFolderId);
      })
      .catch(function (error) {
        console.log(error);
      });
  },

  prepareAutodeskStorage: function (projectId, folderId, fileName, req, callback) {
    var token = new Credentials(req.session);
    var forge3legged = new forgeSDK.AuthClientThreeLegged(
      config.forge.credentials.client_id,
      config.forge.credentials.client_secret,
      config.forge.callbackURL,
      config.forge.scope,
      true);

    var folders = new forgeSDK.FoldersApi();
    folders.getFolderContents(projectId, folderId, {}, forge3legged, token.getForgeCredentials())
      .then(function (folderData) {
        for (var key in folderData.body.data) {
          item = folderData.body.data[key];
          if (item.attributes.displayName === fileName || item.attributes.displayName === withoutExtension(fileName)) {
            if (req.body.conflict === 'skip') {
              callback(null, true);
              return;
            }
            break;
          }
        }

        var projects = new forgeSDK.ProjectsApi();
        projects.postStorage(projectId, storageSpecData(fileName, folderId), forge3legged, token.getForgeCredentials())
          .then(function (storageData) {
            var objectId = storageData.body.data.id;
            var bucketKeyObjectName = getBucketKeyObjectName(objectId);

            var callbackData = {
              fileName: fileName,
              projectId: projectId,
              folderId: folderId,
              objectId: objectId,
              credentials: token.getForgeCredentials()
            };

            callback('https://developer.api.autodesk.com/oss/v2/buckets/' + bucketKeyObjectName.bucketKey + '/objects/' + bucketKeyObjectName.objectName, false, callbackData);
          })
          .catch(function (error) {
            console.log(error);
          });
      });
  },

  createItemOrVersion: function (fileName, projectId, folderId, objectId, credentials, callback) {
    var forge3legged = new forgeSDK.AuthClientThreeLegged(
      config.forge.credentials.client_id,
      config.forge.credentials.client_secret,
      config.forge.callbackURL,
      config.forge.scope,
      true);

    var folders = new forgeSDK.FoldersApi();
    folders.getFolderContents(projectId, folderId, {}, forge3legged, credentials)
      .then(function (folderData) {
        for (var key in folderData.body.data) {
          item = folderData.body.data[key];
          if (item.attributes.displayName === fileName || item.attributes.displayName === withoutExtension(fileName)) {
            break;
          } else {
            item = null;
          }
        }


        if (item) {
          // We found it so we should create a new version
          var versions = new forgeSDK.VersionsApi();
          versions.postVersion(projectId, versionSpecData(fileName, projectId, item.id, objectId), forge3legged, credentials)
            .then(function (versionData) {
              callback()
            })
            .catch(function (error) {
              console.log(error);
            });
        } else {
          // We did not find it so we should create it
          var items = new forgeSDK.ItemsApi();
          items.postItem(projectId, itemSpecData(fileName, projectId, folderId, objectId), forge3legged, credentials)
            .then(function (itemData) {
              callback()
            })
            .catch(function (error) {
              console.log(error);
            });
        }

      })
      .catch(function (error) {
        console.log(error);
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

  postLambdaJob: function (sourceReq, destinationReq, token, data) {
    var newTaskId = guid();
    var request = require('request');
    var stats = require('./../stats/stats');
    stats.usage(token.getAutodeskId(), config.storage.name);

    request({
      url: config.transfer.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.transfer.authorization
      },
      rejectUnhauthorized: false, // required on httpS://localhost
      body: JSON.stringify({
        autodeskId: token.getAutodeskId(),
        taskId: newTaskId,
        source: sourceReq,
        destination: destinationReq,
        callbackData: data,
        callbackURL: config.transfer.callbackURL
      })
    }, function (error, response) {
      // job received by Lambda
      // any error?
      // if a token is available, then notify caller
      if (process.env.CONSOLELOG && response.statusCode!=200){
        console.log('postLambdaJob>' + config.transfer.endpoint + ': ' + response.body);
      }
      if (token) {
        var connectedUser = io.sockets.in(token.getAutodeskId());
        if (connectedUser != null)
          connectedUser.emit('taskStatus', {
            taskId: newTaskId,
            status: (response.statusCode == 200 ? 'started' : 'error')
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

function getBucketKeyObjectName(objectId) {
  // the objectId comes in the form of
  // urn:adsk.objects:os.object:BUCKET_KEY/OBJECT_NAME
  var objectIdParams = objectId.split('/');
  var objectNameValue = objectIdParams[objectIdParams.length - 1];
  // then split again by :
  var bucketKeyParams = objectIdParams[objectIdParams.length - 2].split(':');
  // and get the BucketKey
  var bucketKeyValue = bucketKeyParams[bucketKeyParams.length - 1];

  var ret = {
    bucketKey: bucketKeyValue,
    objectName: objectNameValue
  };

  return ret;
}

function storageSpecData(fileName, folderId) {
  var storageSpecs = {
    jsonapi: {
      version: "1.0"
    },
    data: {
      type: 'objects',
      attributes: {
        name: fileName
      },
      relationships: {
        target: {
          data: {
            type: 'folders',
            id: folderId
          }
        }
      }
    }
  };

  return storageSpecs;
}

function itemSpecData(fileName, projectId, folderId, objectId) {
  var itemsType = projectId.startsWith("a.") ? "items:autodesk.core:File" : "items:autodesk.bim360:File";
  var versionsType = projectId.startsWith("a.") ? "versions:autodesk.core:File" : "versions:autodesk.bim360:File";
  var itemSpec = {
    jsonapi: {
      version: "1.0"
    },
    data: {
      type: "items",
      attributes: {
        displayName: fileName,
        extension: {
          type: itemsType,
          version: "1.0"
        }
      },
      relationships: {
        tip: {
          data: {
            type: "versions",
            id: "1"
          }
        },
        parent: {
          data: {
            type: "folders",
            id: folderId
          }
        }
      }
    },
    included: [{
      type: "versions",
      id: "1",
      attributes: {
        name: fileName,
        extension: {
          type: versionsType,
          version: "1.0"
        }
      },
      relationships: {
        storage: {
          data: {
            type: "objects",
            id: objectId
          }
        }
      }
    }]
  };

  if (fileName.endsWith(".iam.zip")) {
    itemSpec.data[0].attributes.extension.type = "versions:autodesk.a360:CompositeDesign";
    itemSpec.data[0].attributes.name = fileName.slice(0, -4);
    itemSpec.included[0].attributes.name = fileName.slice(0, -4);
  }

  return itemSpec;
}

function versionSpecData(fileName, projectId, itemId, objectId) {
  var versionsType = projectId.startsWith("a.") ? "versions:autodesk.core:File" : "versions:autodesk.bim360:File";

  var versionSpec = {
    "jsonapi": {
      "version": "1.0"
    },
    "data": {
      "type": "versions",
      "attributes": {
        "name": fileName,
        "extension": {
          "type": versionsType,
          "version": "1.0"
        }
      },
      "relationships": {
        "item": {
          "data": {
            "type": "items",
            "id": itemId
          }
        },
        "storage": {
          "data": {
            "type": "objects",
            "id": objectId
          }
        }
      }
    }
  }

  if (fileName.endsWith(".iam.zip")) {
    versionSpec.data.attributes.extension.type = "versions:autodesk.a360:CompositeDesign";
    versionSpec.data.attributes.name = fileName.slice(0, -4);
  }

  return versionSpec;
}

function withoutExtension(fileName) {
  // Remove the last ".<extension>"
  // e.g.:
  // my.file.jpg >> my.file
  // myfile >> myfile
  return fileName.replace(/(.*)\.(.*?)$/, "$1");
}

Object.defineProperty(global, '__stack', {
  get: function () {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
      return stack;
    };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, '__line', {
  get: function () {
    return __stack[1].getLineNumber();
  }
});

Object.defineProperty(global, '__function', {
  get: function () {
    return __stack[1].getFunctionName();
  }
});