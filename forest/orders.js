const { collection } = require('forest-express-sequelize');

collection('orders', {
  isSearchable: true,
  actions: [],
  fields: [
    {
      field: 'id',
      type: 'String',
      isSortable: false,
    }, {
      field: 'shipping_status',
      type: 'String',
      isSortable: true,
    }, {
      field: 'created_at',
      type: 'Date',
      isSortable: true,
    }, {
      field: 'updated_at',
      type: 'Date',
      isSortable: true,
    }, {
      field: 'being_processed_at',
      type: 'Date',
      isSortable: true,
    }, {
      field: 'ready_for_shipping_at',
      type: 'Date',
      isSortable: true,
    }, {
      field: 'in_transit_at',
      type: 'Date',
      isSortable: true,
    }, {
      field: 'shipped_at',
      type: 'Date',
      isSortable: true,
    }, {
      field: 'product',
      type: 'String',
      reference: 'products.id',
      foreignKey: 'product_id',
      isSortable: true,
    }, {
      field: 'customer',
      type: 'String',
      reference: 'customers.id',
      foreignKey: 'customer_id',
      isSortable: true,
    },
  ],
  segments: [],
});
