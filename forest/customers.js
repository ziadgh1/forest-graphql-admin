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
      type: 'Number',
      isSortable: true,
    },{
      field: 'firstname',
      type: 'String',
      isSortable: true,
    },{
      field: 'lastname',
      type: 'String',
      isSortable: true,
    },{
      field: 'email',
      type: 'String',
      isSortable: true,
    },{
      field: 'stripe_id',
      type: 'Number',
      isSortable: true,
    },{
      field: 'created_at',
      type: 'Date',
      isSortable: true,
    },{
      field: 'updated_at',
      type: 'Date',
      isSortable: true,
    },{
      field: 'orders',
      type: ['String'], // Array are excluded from Select / Where GraphQL query builders
      reference: 'orders.id',
      foreignKey: 'customer_id',
    }
  ],
  segments: [],
});
