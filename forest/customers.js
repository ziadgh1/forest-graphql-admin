const { collection } = require('forest-express-sequelize');

collection('customers', {
  isSearchable: true,
  actions: [],
  fields: [
    {
      field: 'id',
      type: 'Number',
      isSortable: true,
    }, {
      field: 'firstname',
      type: 'String',
      isSortable: true,
    }, {
      field: 'lastname',
      type: 'String',
      isSortable: true,
    }, {
      field: 'email',
      type: 'String',
      isSortable: true,
    }, {
      field: 'stripe_id',
      type: 'Number',
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
      field: 'orders',
      type: ['String'], // Array are excluded from Select / Where GraphQL query builders
      reference: 'orders.id',
      foreignKey: 'customer_id',
    },
  ],
  segments: [],
});
