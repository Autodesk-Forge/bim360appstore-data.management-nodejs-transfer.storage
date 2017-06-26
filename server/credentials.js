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

function Credentials(session) {
  this._session = session;
}

Credentials.prototype.setForgeCredentials = function (accessToken) {
  this._session.ForgeCredentials = accessToken;
};

Credentials.prototype.getForgeCredentials = function () {
  return this._session.ForgeCredentials;
};

Credentials.prototype.setStorageCredentials = function (accessToken) {
  this._session.StorageCredentials = accessToken;
};

Credentials.prototype.getStorageCredentials = function () {
  return this._session.StorageCredentials;
};

module.exports = Credentials;