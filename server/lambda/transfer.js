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
  transferFile : function (autodeskId, taskId, source, destination) {

    request
      .get(source)
      .pipe(destination.method === 'PUT' ? request.put(destination) : request.post(destination))
      .on('response', function (r) {
        request({
          url: process.env.STATUS_CALLBACK || 'https://localhost:3000/api/app/callback/transferStatus',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          rejectUnhauthorized: false, // required on httpS://localhost
          body: JSON.stringify({autodeskId: autodeskId, taskId: taskId, status: 'complete'})
        }, function (error, response) {
          // do nothing
        });
      });

    return true;
  }
};