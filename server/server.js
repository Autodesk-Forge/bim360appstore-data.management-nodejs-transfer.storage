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
var session = require('express-session');
var app = express();

// this session will be used to save the oAuth token
app.use(cookieParser());
app.set('trust proxy', 1) // trust first proxy - HTTPS on Heroku
app.use(session({
  secret: 'autodeskforge',
  cookie: {
    httpOnly: true,
    secure: (process.env.NODE_ENV === 'production'),
    maxAge: 1000 * 60 * 60 // 1 hours to expire the session and avoid memory leak
  },
  resave: false,
  saveUninitialized: true
}));

// favicon
var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/../www/favicon.ico'));

// prepare server routing
app.use('/', express.static(__dirname + '/../www')); // redirect static calls
app.use('/js/libraries', express.static(__dirname + '/../node_modules/bootstrap/dist/js')); // redirect static calls
app.use('/js/libraries', express.static(__dirname + '/../node_modules/jquery/dist')); // redirect static calls
app.use('/js/libraries', express.static(__dirname + '/../node_modules/jstree/dist')); // redirect static calls
app.use('/js/libraries', express.static(__dirname + '/../node_modules/moment/min')); // redirect static calls
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
var storageName = config.storage.name;
var storateOAuth = require('./storages/' + storageName + '/oauth.js');
var storateTree = require('./storages/' + storageName + '/tree.js');
var storageIntegration = require('./storages/' + storageName + '/integration.js');
app.use('/', storateOAuth); // redirect oauth API calls
app.use('/', storateTree); // redirect oauth API calls
app.use('/', storageIntegration); // redirect oauth API calls

module.exports = app;