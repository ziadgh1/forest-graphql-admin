const express = require('express');
const { PermissionMiddlewareCreator, RecordSerializer } = require('forest-express-sequelize');
// TODO: is there something better?
const Liana = require('forest-express-sequelize');

const models = require('../models');
const { request, gql } = require('graphql-request');
const GRAPHQL_URL = process.env.GRAPHQL_URL;
const COLLECTION_NAME = 'orders';
const HASURA_OPERATORS = {
  and: '_and',
  or: '_or',
  not: '_not',

};

const HASURA_COMPARISONS = {
  eq: '_eq',
  neq: '_neq',
  gt: '_gt',
  gte: '_gte',
  "???": '_is_null',
  lt: '_lt',
  gte: '_gte',
  gte: '_gte',
  ilike: '_ilike',
  like: '_like',
  nilike: '_nilike',
  nlike: '_nlike',
};

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

const JSON5 = require('json5')


function getCollectionFields(queryFields, collectioName) {

  const schema = Liana.Schemas.schemas[collectioName];
  
  let queryCollectionFields = queryFields[COLLECTION_NAME].split(',');
  let graphQLFields = [];
  for (let i =0; i<queryCollectionFields.length; i++) {
    const queryCollectionField = queryCollectionFields[i];
    const field = schema.fields.filter(item => item.field === queryCollectionField)[0];
    if (field.isGraphQL) {
      if (field.reference) {
        console.log(field);
        let belongsToFields = generateBelongsToFields(queryFields[field.field], field.field);
        graphQLFields.push(belongsToFields);
      }
      else {
        graphQLFields.push(queryCollectionField);
      }
    }
  }
  return graphQLFields.join(' ');
}
// Get a list of Orders
router.get(`/${COLLECTION_NAME}`, permissionMiddlewareCreator.list(), (req, response, next) => {
  //next();
  //forestHasura.list(req,response, next);
  const limit = parseInt(req.query.page.size) || 10;
  const offset = (parseInt(req.query.page.number) - 1) * limit;

  const selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);
  const whereGraphQL = buildWhereConditionSearch(req.query.search, COLLECTION_NAME);
  const orderBy = getOrderBy(req.query.sort);


  const query = gql`
    query get($limit: Int!, $offset: Int!) {
      ${COLLECTION_NAME}(limit: $limit, offset: $offset, where: ${whereGraphQL}, order_by: ${orderBy}) {
        ${selectFields}
      }
    }`;

  const variables = {
    limit,
    offset
  }

  request(GRAPHQL_URL, query, variables).then((data) => {
    const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
    return recordSerializer.serialize(data[COLLECTION_NAME]);
  })
  .then(recordsSerialized => response.send(recordsSerialized))
  .catch(next);

});

function getOrderBy(sort) {
  let direction = 'asc';
  if (sort) {
    if (sort[0] === '-') {
      sort = sort.substring(1);
      direction = 'desc';
    }
    if (sort.includes('.')) {
      const split = sort.split('.');
      return `{ ${split[0]}: { ${split[1]}:  ${direction}} }`
    }
    return `{ ${sort}:  ${direction} }`
  }
  return '{}';
}
// TODO: pas générique :( => mettre un champs isGrahQLSearchable
function buildWhereConditionSearch (search, collectioName) {
  const schema = Liana.Schemas.schemas[collectioName];

  let whereCondition = {};
  if (search) {
    search = '%' + search + '%';
    let wcArray = whereCondition[HASURA_OPERATORS.or] = [];
    for (let i=0;i<schema.fields.length;i++){
      const field = schema.fields[i];
      if (field.isGraphQL && field.type === 'String') {
        if (field.reference) {
          //TODO: Extended search !!
          //wcArray.push({ [???]: { [HASURA_COMPARISONS.ilike]: search} });
        }
        else {
          wcArray.push({ [field.field]: { [HASURA_COMPARISONS.ilike]: search} });
        }
      }
    }
  };
  return JSON5.stringify(whereCondition, {quote: '"'}); // GraphQL expect " for strings and no ' or " for keys
}

function generateBelongsToFields(queryBelongsToReferenceField, belongsToCollection) {
  let belongsToFields = 'id';
  if (queryBelongsToReferenceField != 'id') {
    belongsToFields = 'id' + ' ' + queryBelongsToReferenceField;
  }
  return belongsToCollection + ' { ' + belongsToFields + ' } ';;
}

// Get a number of Orders
router.get(`/${COLLECTION_NAME}/count`, permissionMiddlewareCreator.list(), (req, response, next) => {
  // Learn what this route does here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/routes/default-routes#get-a-number-of-records
  // next();
  const whereGraphQL = buildWhereConditionSearch(req.query.search, COLLECTION_NAME);

  const query = gql`
    query count {
      ${COLLECTION_NAME}_aggregate(where: ${whereGraphQL}) {
        aggregate {
          count
        }
      }
    }`;

  request(GRAPHQL_URL, query).then((data) => {
    let count = 
    data[`${COLLECTION_NAME}_aggregate`].aggregate.count;
    response.send({count});
  })
  .catch(next);  
});

// Get a Order
router.get(`/${COLLECTION_NAME}/:recordId`, permissionMiddlewareCreator.details(), (req, response, next) => {
  // next();
  const recordId = req.params.recordId;
  const selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);


  const query = gql`
    query get($ref: String!) {
      ${COLLECTION_NAME}(ref: $ref) {
        ${selectFields}
      }
    }`;

  const variables = {
    recordId
  }

  request(GRAPHQL_URL, query, variables).then((data) => {
    const recordGetter = new RecordGetter(models[COLLECTION_NAME]);
    return recordGetter.serialize(data[COLLECTION_NAME]);
  })
  .then(recordsSerialized => response.send(recordsSerialized))
  .catch(next);
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
