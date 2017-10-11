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
var config = require('./config');

var refreshTokenMgn = require('./database/tokens');

function Credentials(session) {
  this._session = session;
}

Credentials.prototype.setForgeCredentials = function (accessToken) {
  this._session.ForgeCredentials = accessToken;

  refreshTokenMgn.onNewForgeToken(this.getAutodeskId(), accessToken.access_token,  accessToken.refresh_token, accessToken.expires_at);

  // if the user log in on the storage before Autodesk, then we need the following
  //refreshTokenMgn.onNewStorageToken(this.getAutodeskId(), config.storage.name,
  //  this.getStorageCredentials().refresh_token, this.getStorageCredentials().expires_at)
};

Credentials.prototype.getForgeCredentials = function () {
  return this._session.ForgeCredentials;
};

Credentials.prototype.setAutodeskId = function(autodeskId){
  this._session.AutodeskId = autodeskId;
};

Credentials.prototype.getAutodeskId = function () {
  return this._session.AutodeskId;
};

Credentials.prototype.setStorageCredentials = function (accessToken) {
  // Just to make switching between storage services work better
  // This way we can avoid trying to use credentials of one storage service
  // to get access to another service and fail "misteriously" :)
  this._session.StorageName = config.storage.name;
  this._session.StorageCredentials = accessToken;

  refreshTokenMgn.onNewStorageToken(this.getAutodeskId(), config.storage.name, accessToken.access_token, accessToken.refresh_token, accessToken.expires_at)
};

Credentials.prototype.getStorageCredentials = function () {
  if (this._session.StorageName === config.storage.name) {
    return this._session.StorageCredentials;
  }
};

module.exports = Credentials;