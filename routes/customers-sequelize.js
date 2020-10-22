const express = require('express');
const { PermissionMiddlewareCreator, RecordsGetter } = require('forest-express-sequelize');

const COLLECTION_NAME = 'customersSequelize';
const { customersSequelize } = require('../models');

const router = express.Router();
const permissionMiddlewareCreator = new PermissionMiddlewareCreator(COLLECTION_NAME);

// Get a list of Records
router.get(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.list(), async (request, response, next) => {
  const hrstart = process.hrtime();

  const recordsGetter = new RecordsGetter(customersSequelize);

  const params = request.query;

  recordsGetter.getAll(params)
    .then((records) => recordsGetter.serialize(records))
    .then((recordsSerialized) => {
      response.send(recordsSerialized);
      const hrend = process.hrtime(hrstart);
      console.info('Execution time (Sequelize): %ds %dms', hrend[0], hrend[1] / 1000000);
    })
    .catch(next);
});

module.exports = router;
