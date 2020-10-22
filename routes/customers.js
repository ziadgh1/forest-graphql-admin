const express = require('express');
const { PermissionMiddlewareCreator } = require('forest-express-sequelize');

const COLLECTION_NAME = 'customers';

const ForestHasura = require('../services/forest-hasura');

const forestHasura = new ForestHasura(COLLECTION_NAME, process.env.GRAPHQL_URL);

const router = express.Router();
const permissionMiddlewareCreator = new PermissionMiddlewareCreator(COLLECTION_NAME);

// Get a list of Records
router.get(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.list(), (request, response, next) => {
  const hrstart = process.hrtime();

  forestHasura.list(request, response, next)
    .then(() => {
      const hrend = process.hrtime(hrstart);
      console.info('Execution time (GraphQL): %ds %dms', hrend[0], hrend[1] / 1000000);
    });
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
router.put(`/${COLLECTION_NAME}/:recordId/relationships/:belongsToRelationName`,
  permissionMiddlewareCreator.update(),
  (request, response) => {
    response.send({});
  });

// get the relationship hasMany list
router.get(`/${COLLECTION_NAME}/:recordId/relationships/:belongsToRelationName`, permissionMiddlewareCreator.update(), (request, response, next) => {
  forestHasura.listRelationship(request, response, next);
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
