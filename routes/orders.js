const express = require('express');
const { PermissionMiddlewareCreator } = require('forest-express-sequelize');
const COLLECTION_NAME = 'orders';

const ForestHasura = require('../services/forest-hasura');
const forestHasura = new ForestHasura(COLLECTION_NAME, process.env.GRAPHQL_URL, 'ref');

const router = express.Router();
const permissionMiddlewareCreator = new PermissionMiddlewareCreator(COLLECTION_NAME);

// Get a list of Orders
router.get(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.list(), (request, response, next) => {
  //next();
  forestHasura.list(request, response, next);
});

// Get a Order
router.get(`/${COLLECTION_NAME}/:recordId`, permissionMiddlewareCreator.details(), (request, response, next) => {
  // next();
  forestHasura.details(request, response, next);
});

// Update a Record
router.put(`/${COLLECTION_NAME}/:recordId`, permissionMiddlewareCreator.update(), (request, response, next) => {
  forestHasura.update(request, response, next);
});

// update the relationship is not needed in the relational context
router.put(`/${COLLECTION_NAME}/:recordId/relationships/:belongsToRelationName`, permissionMiddlewareCreator.update(), (request, response, next) => {
  response.send({});
});
  
// ---------------------------------------------------------------------------------------------------------------------------------------------------

// Create a Order
router.post('/orders', permissionMiddlewareCreator.create(), (req, response, next) => {
  // Learn what this route does here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/default-routes#create-a-record
  next();
});


// Delete a Order
router.delete('/orders/:recordId', permissionMiddlewareCreator.delete(), (req, response, next) => {
  // Learn what this route does here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/default-routes#delete-a-record
  next();
});

// Export a list of Orders
router.get('/orders.csv', permissionMiddlewareCreator.export(), (req, response, next) => {
  // Learn what this route does here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/default-routes#export-a-list-of-records
  next();
});

// Delete a list of Orders
router.delete('/orders', permissionMiddlewareCreator.delete(), (req, response, next) => {
  // Learn what this route does here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/default-routes#delete-a-list-of-records
  next();
});


// ==> Not Applicable for Smart Collection
// // Get a number of Orders
// router.get(`/${COLLECTION_NAME}/count`, permissionMiddlewareCreator.list(), (req, response, next) => {
//   // next();
// });

module.exports = router;
