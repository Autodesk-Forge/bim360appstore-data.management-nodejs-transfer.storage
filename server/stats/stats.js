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
  userProfile: function (profile) {
    if (!config.stats.mongo) return;
    if (!mongodb) return;
    if (!mongodb.db) return;
    var today = parseInt((new Date()).getTime());
    var users = mongodb.db.collection('users');
    if (!users) return;
    users.count({
        _id: profile.userId
      }, function (err, count) {
        if (count == 0) {
          users.insert({
            _id: profile.userId,
            email: profile.emailId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            first: today
          });
        }
      });
  },

  usage: function (userId, storage) {
    if (!config.stats.mongo) return;
    if (!mongodb) return;
    if (!mongodb.db) return;
    var users = mongodb.db.collection('users');
    if (!users) return;
    users.count({
      _id: userId
    }, function (err, count) {
      if (count == 1) {
        users.update({
            _id: userId
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
  }
};