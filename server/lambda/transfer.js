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

module.exports = {
  transferFile: function (autodeskId, taskId, source, destination, data, callback) {
    var sourceStatusCode;
    request(source)
      .on('response', function (resSource) {
        if (process.env.NODE_ENV != 'production')
          console.log('Download ' + source.url + ': ' + resSource.statusCode + ' > ' + resSource.statusMessage);

        sourceStatusCode = resSource.statusCode;
        resSource.headers['content-type'] = undefined; // if the source response have this header, Dropbox may file for some types
      })
      .pipe(request(destination)
        .on('response', function (resDestination) {
          if (process.env.NODE_ENV != 'production')
            console.log('Upload ' + destination.url + ': ' + resDestination.statusCode + ' > ' + resDestination.statusMessage);

          var status = {
            autodeskId: autodeskId,
            taskId: taskId,
            status: (!IsOk(resDestination.statusCode) || !IsOk(sourceStatusCode) ? 'error' : 'completed'),
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
        }));

    return true;
  }
};

function IsOk(errorCode){
  return (errorCode>=200 && errorCode<=201);
}