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

module.exports = {
  // Autodesk Forge configuration
  forge: {
    // Required scopes for your application on server-side
    scope: ['data:read', 'data:write', 'data:create', 'data:search'],
    // this this callback URL when creating your client ID and secret
    callbackURL: process.env.FORGE_CALLBACK_URL || 'http://localhost:3000/api/forge/callback/oauth',
    // credentials
    credentials: {
      client_id: process.env.FORGE_CLIENT_ID || '<replace with your consumer key>',
      client_secret: process.env.FORGE_CLIENT_SECRET || '<replace with your consumer secret>'
    }
  },

  // storage settings
  storage: {
    // storage name
    // box, google (drive), dropbox, onedrive, egnyte
    name: process.env.STORAGE_NAME,
    scope: process.env.STORAGE_SCOPE,
    callbackURL: process.env.STORAGE_CALLBACK_URL || 'http://localhost:3000/api/' + process.env.STORAGE_NAME + '/callback/oauth',
    credentials: {
      client_id: process.env.STORAGE_CLIENT_ID || '<replace with your storage client id',
      client_secret: process.env.STORAGE_CLIENT_SECRET || '<replace with your storage client secret'
    }
  }
};