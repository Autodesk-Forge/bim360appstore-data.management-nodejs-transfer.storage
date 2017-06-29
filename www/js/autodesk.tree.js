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

function prepareAutodeskTree() {
  $('#autodeskTree').jstree({
    'core': {
      'themes': {"icons": true},
      'multiple': true,
      'data': {
        "url": '/api/forge/tree',
        "dataType": "json",
        'multiple': true,
        'data': function (node) {
          return {"id": node.id};
        }
      }
    },
    'types': {
      'default': {
        'icon': 'glyphicon glyphicon-question-sign'
      },
      '#': {
        'icon': 'glyphicon glyphicon-user'
      },
      'hubs': {
        'icon': '/img/a360Hub.png' // should have a better icon
      },
      'personalHub': {
        'icon': '/img/a360Hub.png'
      },
      'bim360Hubs': {
        'icon': '/img/bim360Hub.png'
      },
      'bim360projects': {
        'icon': '/img/bim360project.png'
      },
      'a360projects': {
        'icon': '/img/a360project.png'
      },
      'items': {
        'icon': 'glyphicon glyphicon-file'
      },
      'folders': {
        'icon': 'glyphicon glyphicon-folder-open'
      },
      'versions': {
        'icon': 'glyphicon glyphicon-time'
      }
    },
    "plugins": ["types", "state", "sort", "contextmenu"],
    "state" : { "key" : "autodeskTree" }
    //contextmenu: {items: autodeskCustomMenu}
  });

  $('#refreshAutodeskTree').click(function () {
    $('#autodeskTree').jstree(true).refresh();
  })
}
