const { collection } = require('forest-express-sequelize');

collection('orders', {
  isSearchable: true,
  actions: [],
  fields: [
    {
      field: 'id',
      type: 'String',
      isNotGraphQLField: true,
      isSortable: false,
      get(order) {
        return order.ref;
      },
    }, {
      field: 'ref',
      type: 'String',
      isSortable: true,
    // primaryKey: true, // Not Supported => create a real smart field id that returns the ref field
    }, {
      field: 'shipping_status',
      type: 'String',
      // isVirtual: false, //Is not supported :(
      // isFilterable: true, //Is not supported :(
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
    }, {
      field: 'delivery',
      type: 'String',
      reference: 'deliveries.id',
      foreignKey: 'delivery_id',
      isSortable: true,
    },
  ],
  segments: [],
});
