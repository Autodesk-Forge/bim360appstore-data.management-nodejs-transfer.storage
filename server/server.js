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

var express = require('express');
var cookieParser = require('cookie-parser');
//var session = require('express-session');
var cookieSession = require('cookie-session')

var app = express();

// favicon
var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/../www/img/autodesk.png'));

// this session will be used to save the oAuth token
app.use(cookieParser());
app.set('trust proxy', 1) // trust first proxy - HTTPS on Heroku
/*app.use(session({
  secret: 'autodeskforge',
  cookie: {
    httpOnly: true,
    secure: (process.env.NODE_ENV === 'production'),
    maxAge: 1000 * 60 * 60 // 1 hours to expire the session and avoid memory leak
  },
  resave: false,
  saveUninitialized: true
}));*/

app.use(cookieSession({
  name: 'session',
  keys: ['autodeskForge'],

  // Cookie Options
  maxAge: 60 * 60 * 1000
}));


// prepare server routing
app.use('/', express.static(__dirname + '/../www')); // redirect static calls
app.use('/js/libraries', express.static(__dirname + '/../node_modules/bootstrap/dist/js')); // redirect static calls
app.use('/js/libraries', express.static(__dirname + '/../node_modules/jquery/dist')); // redirect static calls
app.use('/js/libraries', express.static(__dirname + '/../node_modules/jstree/dist')); // redirect static calls
app.use('/js/libraries', express.static(__dirname + '/../node_modules/moment/min')); // redirect static calls
//app.use('/socket.io', express.static(__dirname + '/../node_modules/socket.io-client/dist')); // redirect static calls
app.use('/css/libraries', express.static(__dirname + '/../node_modules/bootstrap/dist/css')); // redirect static calls
app.use('/css/libraries/jstree', express.static(__dirname + '/../node_modules/jstree/dist/themes/default')); // redirect static calls (jstree use 'style.css', which is very generic, so let's use an extra folder)
app.use('/css/fonts', express.static(__dirname + '/../node_modules/bootstrap/dist/fonts')); // redirect static calls
app.set('port', process.env.PORT || 3000); // main port

var appSettings = require('./appSettings.js');
app.use('/', appSettings);


// prepare our API endpoint routing
var oauth = require('./forge/oauth.js');
var dataManagement = require('./forge/tree.js');
//var modelDerivative = require('./forge/model.derivative.js');
app.use('/', oauth); // redirect oauth API calls
app.use('/', dataManagement); // redirect our custom API calls
//app.use('/', modelDerivative); // redirect our custom API calls

var config = require('./config');
var storageName = config.storage.name.toLowerCase();
var storateOAuth = require('./storages/' + storageName + '/oauth.js');
var storateTree = require('./storages/' + storageName + '/tree.js');
var storageIntegration = require('./storages/' + storageName + '/integration.js');
app.use('/', storateOAuth); // redirect oauth API calls
app.use('/', storateTree); // redirect oauth API calls
app.use('/', storageIntegration); // redirect oauth API calls

// this condition should allow the local transfer if on localhost heroku
if (process.env.TRANSFER_ENDPOINT && (process.env.TRANSFER_ENDPOINT.indexOf('localhost') > -1 || process.env.TRANSFER_ENDPOINT.indexOf('herokuapp') > -1)) {
  // define a local testing that transfer the files
  var localTransfer = require('./lambda/localEndpoint');
  app.use('/', localTransfer);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // for httpS://localhost

if (process.env.MONGO_STATS) {
  var mongodb = require('./stats/mongodb');
  mongodb.connect(
    function () {
      console.log('Mongo connection live');
    },
    function (err) {
      console.log('Could not connect to mongo');
    }
  );
}

module.exports = app;