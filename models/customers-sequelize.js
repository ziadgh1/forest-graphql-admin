module.exports = (sequelize, DataTypes) => {
  // const { Sequelize } = sequelize;
  const CustomersSequelize = sequelize.define('customersSequelize', {
    firstname: {
      type: DataTypes.STRING,
    },
    lastname: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
    stripeId: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'customers',
    underscored: true,
    schema: process.env.DATABASE_SCHEMA,
  });

  // This section contains the relationships for this model. See: https://docs.forestadmin.com/documentation/v/v6/reference-guide/relationships#adding-relationships.
  // CustomersSequelize.associate = (models) => {
  //   CustomersSequelize.hasMany(models.orders, {
  //     foreignKey: {
  //       name: 'customerIdKey',
  //       field: 'customer_id',
  //     },
  //     as: 'orders',
  //   });
  // };

  return CustomersSequelize;
};
