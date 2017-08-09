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

var haveBIM360Hub = false;

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
          $('#autodeskTree').jstree(true).toggle_node(node);
          return {"id": node.id};
        },
        "success": function (nodes) {
          nodes.forEach(function (n) {
            if (n.type === 'bim360Hubs' && n.id.indexOf('b.') > 0)
              haveBIM360Hub = true;
          });

          if (!haveBIM360Hub) {
            $.getJSON("/api/forge/clientID", function (res) {
              $("#ClientID").val(res.ForgeClientId);
              $("#provisionAccountModal").modal();
              $("#provisionAccountSave").click(function () {
                $('#provisionAccountModal').modal('toggle');
                $('#autodeskTree').jstree(true).refresh();
              });
              haveBIM360Hub = true;
            });
          }
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
        'icon': '/img/a360hub.png'
      },
      'personalHub': {
        'icon': '/img/a360hub.png'
      },
      'bim360Hubs': {
        'icon': '/img/bim360hub.png'
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
      },
      'unsupported': {
        'icon': 'glyphicon glyphicon-ban-circle'
      }

    },
    "plugins": ["types", "state", "sort"],
    "state": {"key": "autodeskTree"}
  });

  $('#refreshAutodeskTree').click(function () {
    $('#autodeskTree').jstree(true).refresh();
  })
}
