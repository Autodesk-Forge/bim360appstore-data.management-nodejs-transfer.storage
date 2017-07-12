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

function prepareStorageTree() {
  $('#storageTree').jstree({
    'core': {
      'themes': {"icons": true},
      'data': {
        "url": '/api/storage/tree',
        "dataType": "json",
        'multiple': false,
        'data': function (node) {
          $('#storageTree').jstree(true).toggle_node(node);
          return {"id": node.id};
        }
      }
    },
    'types': {
      'default': {
        'icon': 'glyphicon glyphicon-cloud'
      },
      '#': {
        'icon': 'glyphicon glyphicon-user'
      },
      'hubs': {
        'icon': 'glyphicon glyphicon-inbox'
      },
      'projects': {
        'icon': 'glyphicon glyphicon-list-alt'
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
    "plugins": ["types", "state", "sort"],
    "state" : { "key" : "storageTree" }
  });

  $('#refreshStorageTree').click(function () {
    $('#storageTree').jstree(true).refresh();
  })
}
