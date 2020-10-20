const { collection } = require('forest-express-sequelize');

// This file allows you to add to your Forest UI:
// - Smart actions: https://docs.forestadmin.com/documentation/reference-guide/actions/create-and-manage-smart-actions
// - Smart fields: https://docs.forestadmin.com/documentation/reference-guide/fields/create-and-manage-smart-fields
// - Smart relationships: https://docs.forestadmin.com/documentation/reference-guide/relationships/create-a-smart-relationship
// - Smart segments: https://docs.forestadmin.com/documentation/reference-guide/segments/smart-segments
collection('products', {
  isSearchable: true,
  actions: [],
  fields: [  
  {
    field: 'id',
    type: 'Number',
    isGraphQL: true,
    isSortable: true,
  },{
    field: 'label',
    type: 'String',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'picture',
    type: 'String',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'price',
    type: 'Number',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'created_at',
    type: 'Date',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'updated_at',
    type: 'Date',
    isSortable: true,
    isGraphQL: true,
  },
],
  segments: [],
});
