const { collection } = require('forest-express-sequelize');

collection('files', {
  isSearchable: true,
  actions: [],
  fields: [  
  {
    field: 'id',
    type: 'String',
    isSortable: true,
  },{
    field: 'filename',
    type: 'String',
    isSortable: true,
  },{
    field: 'url',
    type: 'String',
    isSortable: true,
  },{
    field: 'created_at',
    type: 'Date',
    isSortable: true,
  },{
    field: 'updated_at',
    type: 'Date',
    isSortable: true,
  },
],
  segments: [],
});
