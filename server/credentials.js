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

function Credentials(session) {
  this._session = session;
}

Credentials.prototype.setForgeCredentials = function (accessToken) {
  this._session.FC = accessToken;
};

Credentials.prototype.getForgeCredentials = function () {
  return this._session.FC;
};

Credentials.prototype.setAutodeskId = function(autodeskId){
  this._session.AI = autodeskId;
};

Credentials.prototype.getAutodeskId = function () {
  return this._session.AI;
};

Credentials.prototype.setStorageCredentials = function (accessToken) {
  // Just to make switching between storage services work better
  // This way we can avoid trying to use credentials of one storage service
  // to get access to another service and fail "misteriously" :)
  this._session.SN = config.storage.name
  this._session.SC = accessToken;
};

Credentials.prototype.getStorageCredentials = function () {
  if (this._session.SN === config.storage.name) {
    return this._session.SC;
  }
};

module.exports = Credentials;