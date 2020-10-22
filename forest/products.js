const { collection } = require('forest-express-sequelize');

collection('products', {
  isSearchable: true,
  actions: [],
  fields: [
    {
      field: 'id',
      type: 'Number',
      isSortable: true,
    }, {
      field: 'label',
      type: 'String',
      isSortable: true,
    }, {
      field: 'picture',
      type: 'String',
      isSortable: true,
    }, {
      field: 'price',
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
    },
  ],
  segments: [
    {
      name: 'Products > $3000',
      where: () => '{ price: {_gt: "3000"} }',
    },
    {
      name: 'Products Star Wars',
      where: () => '{ label: {_ilike: "%Star Wars%"} }',
    },
  ],
});
