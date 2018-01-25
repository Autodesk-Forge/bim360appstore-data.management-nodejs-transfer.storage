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

// token handling in session
var Credentials = require('./../credentials');
// forge config information, such as client ID and secret
var config = require('./../config');

var mongodb = require('./mongodb');


module.exports = {
  // This feature is not GDPR compliant
  userProfile: function (profile) {
    if (!config.stats.mongo) return;
    if (!mongodb) return;
    if (!mongodb.db) return;
    var today = parseInt((new Date()).getTime());
    var users = mongodb.db.collection('users');
    if (!users) return;
    users.count({
      autodeskId: profile.userId
    }, function (err, count) {
      if (count == 0) {
        users.insert({
          autodeskId: profile.userId,
          email: profile.emailId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          first: today
        });
      }
    });
  },

  // This feature is not GDPR compliant
  usage: function (userId, storage) {
    if (!config.stats.mongo) return;
    if (!mongodb) return;
    if (!mongodb.db) return;
    var users = mongodb.db.collection('users');
    if (!users) return;
    users.count({
      autodeskId: userId
    }, function (err, count) {
      if (count == 1) {
        users.update({
            autodeskId: userId
          }, {
            $addToSet: {
              'usage': {
                storage: storage
              }
            }
          },
          function (err, result) {
            if (err) console.log(err);
          });
      }
    });
  },

  transfer: function (projectId, direction) {
    if (!config.stats.mongo) return;
    if (!mongodb) return;
    if (!mongodb.db) return;
    var projects = mongodb.db.collection('projects');
    if (!projects) return;
    projects.count({
      _id: projectId
    }, function (err, count) {

      if (count == 0) {
        var push = JSON.parse('{"' + direction + '":[{"' + config.storage.name + '": "' + new Date(Date.now()).toISOString() + '"}]}')
        var insert = {_id: projectId}
        Object.assign(insert, push);
        projects.insert(insert, function (err, results) {
          if (err) console.log(err);
        });
      }
      else if (count == 1) {
        var push = JSON.parse('{"' + direction + '":{"' + config.storage.name + '": "' + new Date(Date.now()).toISOString() + '"}}')
        projects.update({_id: projectId},
          {$push: push},
          function (err, result) {
            if (err) console.log(err);
          }
        )
        ;
      }
    });
  }
};