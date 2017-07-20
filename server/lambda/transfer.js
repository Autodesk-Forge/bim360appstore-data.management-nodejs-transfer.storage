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

var request = require('request');
var BoxSDK = require('box-node-sdk');

module.exports = {
  transferFile: function (autodeskId, taskId, source, destination, data, callback) {

    // as of now adding an exception for BOX UPLOAD
    if (destination.url.indexOf('upload.box.com') > 0) {
      request(source, function (error, sourceRes, file) {



        var sdk = new BoxSDK({
          clientID: destination.credentials.ClientID, // required
          clientSecret: destination.credentials.ClientSecret // required
        });

        var box = sdk.getBasicClient(destination.credentials.Authorization);
        box.files.uploadFile(destination.file.attributes.parent.id, destination.file.attributes.name, file, function (err, boxdata) {
          MakeCallback(autodeskId, taskId, sourceRes.statusCode, (err ? 500 : 200), data, callback);
        });
      });
    }
    else {
      var sourceStatusCode;
      request(source)
        .on('response', function (resSource) {
          if (process.env.CONSOLELOG)
            console.log('Download ' + source.url + ': ' + resSource.statusCode + ' > ' + resSource.statusMessage);

          sourceStatusCode = resSource.statusCode;
          resSource.headers['content-type'] = undefined; // if the source response have this header, Dropbox may file for some types
        })
        .pipe(request(destination)
          .on('response', function (resDestination) {
            if (process.env.CONSOLELOG)
              console.log('Upload ' + destination.url + ': ' + resDestination.statusCode + ' > ' + resDestination.statusMessage);

            MakeCallback(autodeskId, taskId, destination.statusCode, sourceStatusCode, data, callback);
          }));
    }
    return true;
  }
};

function MakeCallback(autodeskId, taskId, destinationStatusCode, sourceStatusCode, data, callback) {
  var status = {
    autodeskId: autodeskId,
    taskId: taskId,
    status: (!IsOk(destinationStatusCode) || !IsOk(sourceStatusCode) ? 'error' : 'completed'),
    data: data
  };


  // send the callback
  request({
    url: callback,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    rejectUnhauthorized: false, // required on httpS://localhost
    body: JSON.stringify(status)
  }, function (error, response) {
    // do nothing?
  });
}

function IsOk(errorCode) {
  return (errorCode >= 200 && errorCode <= 201);
}