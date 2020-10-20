const express = require('express');
const { PermissionMiddlewareCreator } = require('forest-express-sequelize');
// TODO: is there something better?

//const models = require('../models');
const { request, gql } = require('graphql-request');
const GRAPHQL_URL = process.env.GRAPHQL_URL;
const COLLECTION_NAME = 'orders';

const ForestHasura = require('../services/forest-hasura');
const forestHasura = new ForestHasura(COLLECTION_NAME, process.env.GRAPHQL_URL);

const router = express.Router();
const permissionMiddlewareCreator = new PermissionMiddlewareCreator(COLLECTION_NAME);

// This file contains the logic of every route in Forest Admin for the collection orders:
// - Native routes are already generated but can be extended/overriden - Learn how to extend a route here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/extend-a-route
// - Smart action routes will need to be added as you create new Smart Actions - Learn how to create a Smart Action here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/actions/create-and-manage-smart-actions

// Create a Order
router.post('/orders', permissionMiddlewareCreator.create(), (req, response, next) => {
  // Learn what this route does here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/default-routes#create-a-record
  next();
});

// Update a Order
router.put('/orders/:recordId', permissionMiddlewareCreator.update(), (req, response, next) => {
  // Learn what this route does here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/default-routes#update-a-record
  next();
});

// Delete a Order
router.delete('/orders/:recordId', permissionMiddlewareCreator.delete(), (req, response, next) => {
  // Learn what this route does here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/default-routes#delete-a-record
  next();
});

// Get a list of Orders
router.get(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.list(), (request, response, next) => {
  //next();
  forestHasura.list(request, response, next);
});

// ==> Not Applicable for Smart Collection
// // Get a number of Orders
// router.get(`/${COLLECTION_NAME}/count`, permissionMiddlewareCreator.list(), (req, response, next) => {
//   // next();
// });

// Get a Order
router.get(`/${COLLECTION_NAME}/:recordId`, permissionMiddlewareCreator.details(), (request, response, next) => {
  // next();
  forestHasura.details(request, response, next);
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

module.exports = router;
