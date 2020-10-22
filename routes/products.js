const express = require('express');
const { PermissionMiddlewareCreator } = require('forest-express-sequelize');
const COLLECTION_NAME = 'products';

const ForestHasura = require('../services/forest-hasura');
const forestHasura = new ForestHasura(COLLECTION_NAME, process.env.GRAPHQL_URL);

const router = express.Router();
const permissionMiddlewareCreator = new PermissionMiddlewareCreator(COLLECTION_NAME);


// Get a list of Records
router.get(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.list(), (request, response, next) => {
  const segment = request.query.segment;
  forestHasura.list(request, response, next);
});

// Get a Record
router.get(`/${COLLECTION_NAME}/:recordId`, permissionMiddlewareCreator.list(), (request, response, next) => {
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

  
// Delete a Record
router.delete(`/${COLLECTION_NAME}/:recordId`, permissionMiddlewareCreator.delete(), (request, response, next) => {
  forestHasura.delete(request, response, next);
});

// Delete a list of Record
router.delete(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.delete(), (request, response, next) => {
  forestHasura.deleteBulk(request, response, next);
});

// Create a Record
router.post(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.create(), (request, response, next) => {
  forestHasura.create(request, response, next);
});

module.exports = router;
