const { RecordSerializer } = require('forest-express-sequelize');
const Liana = require('forest-express-sequelize');
const { request, gql } = require('graphql-request');


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
function ForestHasura(collectionName, graphqlURL) {
  const COLLECTION_NAME = collectionName;
  const GRAPHQL_URL = graphqlURL;

  this.list  = async function (req, res, next) {
    const limit = parseInt(req.query.page.size) || 10;
    const offset = (parseInt(req.query.page.number) - 1) * limit;
  
    const selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);
    const whereGraphQL = buildWhereConditionSearch(req.query.search, COLLECTION_NAME);
    const orderBy = getOrderBy(req.query.sort);
  
  
    const query = gql`
      query get_and_count($limit: Int!, $offset: Int!) {
        ${COLLECTION_NAME}(limit: $limit, offset: $offset, where: ${whereGraphQL}, order_by: ${orderBy}) {
          ${selectFields}
        }
        ${COLLECTION_NAME}_aggregate(where: ${whereGraphQL}) {
          aggregate {
            count
          }
        }
      }`;
  
    const variables = {
      limit,
      offset
    }
  
    request(GRAPHQL_URL, query, variables).then(async (data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      const recordsSerialized = await recordSerializer.serialize(data[COLLECTION_NAME]);
      const count = data[`${COLLECTION_NAME}_aggregate`].aggregate.count;
      res.send({ ...recordsSerialized, meta:{ count }})
    })
    .catch(next);    
  }

  this.details  = async function (req, res, next) {
    const recordId = req.params.recordId;
    if (recordId === 'count') return; // bug?
    const selectFields = getDetailsFields(COLLECTION_NAME);
  
  
    const query = gql`
      query details($ref: String!) {
        ${COLLECTION_NAME}_by_pk(ref: $ref) {
          ${selectFields}
        }
      }`;
  
    const variables = {
      ref: recordId
    }
  
    request(GRAPHQL_URL, query, variables).then((data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      return recordSerializer.serialize(data[`${COLLECTION_NAME}_by_pk`]);
    })
    .then(recordsSerialized => res.send(recordsSerialized))
    .catch(next);
  }
}


module.exports = ForestHasura;


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

function getDetailsFields (collectioName) {
  const schema = Liana.Schemas.schemas[collectioName];

  let detailsFields = [];

  for (let i=0;i<schema.fields.length;i++){
    const field = schema.fields[i];
    if (field.isGraphQL) {
      if (field.reference) {
        //TODO: ???
        detailsFields;
      }
      else {
        detailsFields.push(field.field);
      }
    }
  }
  return detailsFields.join(' ');
}

function generateBelongsToFields(queryBelongsToReferenceField, belongsToCollection) {
  let belongsToFields = 'id';
  if (queryBelongsToReferenceField != 'id') {
    belongsToFields = 'id' + ' ' + queryBelongsToReferenceField;
  }
  return belongsToCollection + ' { ' + belongsToFields + ' } ';;
}

const JSON5 = require('json5')


function getCollectionFields(queryFields, collectioName) {

  const schema = Liana.Schemas.schemas[collectioName];
  
  let queryCollectionFields = queryFields[collectioName].split(',');
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