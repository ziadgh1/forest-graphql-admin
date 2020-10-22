const { collection } = require('forest-express-sequelize');

collection('customers_files', {
  isSearchable: true,
  actions: [],
  fields: [  
  {
    field: 'id',
    type: 'String',
    isNotGraphQLField: true,
    isSortable: false,
    get(customer_file) {
      return customer_file.customer_id + '|' + customer_file.file_id;
    }
  },{
    field: 'customer',
    type: 'String', 
    reference: 'customers.id',
    foreignKey: 'customer_id',
  },{
    field: 'file',
    type: 'String', 
    reference: 'files.id',
    foreignKey: 'file_id',
  },{
    field: 'customer_id',
    type: 'Number', 
  },{
    field: 'file_id',
    type: 'Number', 
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
