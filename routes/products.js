const express = require('express');
const { PermissionMiddlewareCreator } = require('forest-express-sequelize');
const COLLECTION_NAME = 'products';

const ForestHasura = require('../services/forest-hasura');
const forestHasura = new ForestHasura(COLLECTION_NAME, process.env.GRAPHQL_URL);

const router = express.Router();
const permissionMiddlewareCreator = new PermissionMiddlewareCreator(COLLECTION_NAME);


// Get a list of Records
router.get(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.list(), (request, response, next) => {
  forestHasura.list(request, response, next);
});

// Get a Record
router.get(`/${COLLECTION_NAME}/:recordId`, permissionMiddlewareCreator.list(), (request, response, next) => {
    forestHasura.details(request, response, next);
});

module.exports = router;
