const { collection } = require('forest-express-sequelize');

// This file allows you to add to your Forest UI:
// - Smart actions: https://docs.forestadmin.com/documentation/reference-guide/actions/create-and-manage-smart-actions
// - Smart fields: https://docs.forestadmin.com/documentation/reference-guide/fields/create-and-manage-smart-fields
// - Smart relationships: https://docs.forestadmin.com/documentation/reference-guide/relationships/create-a-smart-relationship
// - Smart segments: https://docs.forestadmin.com/documentation/reference-guide/segments/smart-segments
collection('deliveries', {
  isSearchable: true,
  actions: [],
  fields: [
    {
      field: 'id',
      type: 'Number',
      isSortable: true,
    },{
      field: 'phone',
      type: 'String',
      isSortable: true,
    },{
      field: 'lng',
      type: 'String',
      isSortable: true,
    },{
      field: 'lat',
      type: 'Number',
      isSortable: true,
    },{
      field: 'is_delivered',
      type: 'Boolean',
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
