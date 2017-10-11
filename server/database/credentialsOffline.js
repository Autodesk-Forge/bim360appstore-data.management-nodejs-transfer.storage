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

// app config settings
var config = require('./../config');

var refreshTokenMgn = require('./tokens');

var self; // can improve this? need to research

function CredentialsOffline(autodeskId, storageName) {
  this._autodeskId = autodeskId;
  this._storageName = storageName;
  this._tokens = null;
  self = this;
}

CredentialsOffline.prototype.init = function (callback) {
  refreshTokenMgn.getTokens(this._autodeskId, this._storageName, function (tokens) {
    self._tokens = tokens;
    callback();
  });
};

CredentialsOffline.prototype.getForgeCredentials = function () {
  return {access_token: this._tokens.forge.access_token};
};

CredentialsOffline.prototype.getAutodeskId = function () {
  return this._autodeskId;
};

CredentialsOffline.prototype.getStorageCredentials = function () {
  return {access_token: this._tokens.storage.access_token};
};

module.exports = CredentialsOffline;