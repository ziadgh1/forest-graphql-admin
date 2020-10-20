const { collection } = require('forest-express-sequelize');

// This file allows you to add to your Forest UI:
// - Smart actions: https://docs.forestadmin.com/documentation/reference-guide/actions/create-and-manage-smart-actions
// - Smart fields: https://docs.forestadmin.com/documentation/reference-guide/fields/create-and-manage-smart-fields
// - Smart relationships: https://docs.forestadmin.com/documentation/reference-guide/relationships/create-a-smart-relationship
// - Smart segments: https://docs.forestadmin.com/documentation/reference-guide/segments/smart-segments
collection('customers', {
  isSearchable: true,
  actions: [],
  fields: [
    {
      field: 'id',
      type: 'String',
      isGraphQL: true,
      isSortable: true,
    },{
      field: 'firstname',
      type: 'String',
      isSortable: true,
      isGraphQL: true,
    },{
      field: 'lastname',
      type: 'String',
      isSortable: true,
      isGraphQL: true,
    },{
      field: 'email',
      type: 'Number',
      isSortable: true,
      isGraphQL: true,
    },{
      field: 'stripe_id',
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
