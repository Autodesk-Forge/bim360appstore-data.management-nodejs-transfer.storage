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

'use strict';

var app = require('./server/server');

if (process.env.FORGE_CLIENT_ID == null || process.env.FORGE_CLIENT_SECRET == null)
  console.log('*****************\nWARNING: Forge Client ID & Client Secret not defined as environment variables.\n*****************');

if (process.env.STORAGE_NAME == null)
  console.log('*****************\nWARNING: Storage type not defined as environment variables.\n*****************');

if (process.env.STORAGE_CLIENT_ID == null || process.env.STORAGE_CLIENT_SECRET == null)
  console.log('*****************\nWARNING: Storage Client ID & Client Secret not defined as environment variables.\n*****************');

var server;

console.log('Storage: ' + process.env.STORAGE_NAME);
console.log('Starting at ' + (new Date()).toString());

// In case of production environment (e.g. herokuapp) https will
// be provided automatically, otherwise we need to set up the local https
// support using https library and our locally saved keys
if (process.env.NODE_ENV === "production") {
  // start server
   server = app.listen(app.get('port'), function () {
     console.log('Server listening on port ' + server.address().port);
  });
} else {
  // Setting up local https support
  var fs = require('fs');
  var https = require('https');

  var options = {
    key: fs.readFileSync('./server/https/server.key'), //('/etc/apache2/ssl/server.key'),
    cert: fs.readFileSync('./server/https/server.crt'), //('/etc/apache2/ssl/server.crt'),
    passphrase: 'erny97',
    requestCert: false,
    rejectUnauthorized: false
  };

  // start server
  var server = https.createServer(options, app).listen(app.get('port'), function () {
    console.log('Server listening on port ' + server.address().port);
  });
}

global.io = require('socket.io')(server);
io.on('connection', function (socket) {
  socket.on('join', function (data) {
    socket.join(data.autodeskId);
  });

  socket.on('statusUpdate', function (data) {

  });
});