const { collection } = require('forest-express-sequelize');

// This file allows you to add to your Forest UI:
// - Smart actions: https://docs.forestadmin.com/documentation/reference-guide/actions/create-and-manage-smart-actions
// - Smart fields: https://docs.forestadmin.com/documentation/reference-guide/fields/create-and-manage-smart-fields
// - Smart relationships: https://docs.forestadmin.com/documentation/reference-guide/relationships/create-a-smart-relationship
// - Smart segments: https://docs.forestadmin.com/documentation/reference-guide/segments/smart-segments
collection('orders', {
  actions: [],
  fields: [
  {
    field: 'ref',
    type: 'String',
    isGraphQL: true,
    isSortable: true,
    //primaryKey: true, // Not Supported => declared it in the 'fake' sequelize model
  }, 
  {
    field: 'shipping_status',
    type: 'String',
    //isVirtual: false, //Is not supported :(
    //isFilterable: true, //Is not supported :(
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
  },{
    field: 'being_processed_at',
    type: 'Date',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'ready_for_shipping_at',
    type: 'Date',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'in_transit_at',
    type: 'Date',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'shipped_at',
    type: 'Date',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'product',
    type: 'String',
    reference: 'products.id',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'customer',
    type: 'String',
    reference: 'customers.id',
    isSortable: true,
    isGraphQL: true,
  },{
    field: 'delivery',
    type: 'String',
    reference: 'deliveries.id',
    isSortable: true,
    isGraphQL: true,
  },    
  ],
  segments: [],
});
