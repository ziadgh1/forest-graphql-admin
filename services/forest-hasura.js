const cookieParser = require('cookie-parser');
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
  isnull: '_is_null',
  lt: '_lt',
  gte: '_gte',
  gte: '_gte',
  ilike: '_ilike',
  like: '_like',
  nilike: '_nilike',
  nlike: '_nlike',
};
// case 'present':
//     [_this.OPERATORS.NE]: null
// case 'blank':
//   return isTextField ? {
//     [_this.OPERATORS.OR]: [{
//       [_this.OPERATORS.EQ]: null
//     }, {
//       [_this.OPERATORS.EQ]: ''
//     }]
//   } : {
//     [_this.OPERATORS.EQ]: null
//   };

function ForestHasura(collectionName, graphqlURL, idField) {
  const COLLECTION_NAME = collectionName;
  const GRAPHQL_URL = graphqlURL;
  const ID_FIELD = idField?idField:'id';

  this.list  = async function (req, res, next) {

    if (req.query.context) {
      // This is a belongsTo search
      this.listDropdown(req,res,next);
      return;
    }  
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

  this.listDropdown = async function (req, res, next) {
    let selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);
    if (selectFields !== 'id') { //TODO: id can be different
      selectFields = ID_FIELD + ' ' + selectFields;
    }

    const whereField = `${req.query.fields[COLLECTION_NAME]}`;
    const search = req.query.search;
    const field = Liana.Schemas.schemas[COLLECTION_NAME].fields.filter(field => field.field === whereField)[0];

    const whereCondition = getWhereCondition(field, search);

    const whereGraphQL = JSON5.stringify(whereCondition, {quote: '"'});

    const query = gql`
      query getDropDown {
        ${COLLECTION_NAME}(where: ${whereGraphQL}) {
          ${selectFields}
        }
      }`;
  
    request(GRAPHQL_URL, query).then(async (data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      const recordsSerialized = await recordSerializer.serialize(data[COLLECTION_NAME]);
      res.send(recordsSerialized);
    })
    .catch(next);    
  }

  this.details  = async function (req, res, next) {
    const recordId = req.params.recordId;
    if (recordId === 'count') return; // bug?
    const selectFields = getDetailsFields(COLLECTION_NAME);
  
  
    const query = gql`
      query details {
        ${COLLECTION_NAME}_by_pk(${ID_FIELD}: "${recordId}") {
          ${selectFields}
        }
      }`;
  
    // const variables = {
    //   id: recordId
    // }
  
    request(GRAPHQL_URL, query).then((data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      return recordSerializer.serialize(data[`${COLLECTION_NAME}_by_pk`]);
    })
    .then(recordsSerialized => res.send(recordsSerialized))
    .catch(next);
  }

  this.update  = async function (req, res, next) {
    const recordId = req.params.recordId;
    let attributes = req.body.data.attributes;
    const relationships = req.body.data.relationships;
    for (const [key, value] of Object.entries(relationships)) {
      console.log(`${key}: ${value}`);
      const schema = Liana.Schemas.schemas[COLLECTION_NAME];
      const foreignKey = schema.fields.filter(field => field.field === key)[0].foreignKey;
      attributes[camelToUnderscore(foreignKey)] = value.data.id; //TODO: id field might be different for orders?
    }
    const setValues = JSON5.stringify(attributes, {quote: '"'});

    const selectFields = getDetailsFields(COLLECTION_NAME);
  
    const query = gql`
      mutation update {
        update_${COLLECTION_NAME}_by_pk(pk_columns: {${ID_FIELD}: "${recordId}"}, _set: ${setValues}) {
          ${selectFields}
        }
      }`;
  
    request(GRAPHQL_URL, query).then((data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      return recordSerializer.serialize(data[`update_${COLLECTION_NAME}_by_pk`]);
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
    let wcArray = whereCondition[HASURA_OPERATORS.or] = [];
    for (let i=0;i<schema.fields.length;i++){
      const field = schema.fields[i];
      if (field.isGraphQL) {
        if (field.reference) {
          //TODO: Extended search !!
          //wcArray.push({ [???]: { [HASURA_COMPARISONS.ilike]: '%' + search + '%'} });
        }
        else {
          const whereCondition = getWhereCondition(field, search);
          if (whereCondition) wcArray.push(whereCondition);
        }
      }
    }
  };
  return JSON5.stringify(whereCondition, {quote: '"'}); // GraphQL expect " for strings and no ' or " for keys
}

function getWhereCondition(field, search) {
  switch (field.type) {
    case 'String':
      return { [camelToUnderscore(field.field)]: { [HASURA_COMPARISONS.ilike]: '%' + search + '%'} };
    case 'Number':
      return { [camelToUnderscore(field.field)]: { [HASURA_COMPARISONS.eq]: search} };
  }
  return null;
}

function camelToUnderscore(key) {
  var result = key.replace( /([A-Z])/g, " $1" );
  return result.split(' ').join('_').toLowerCase();
}

function getDetailsFields (collectioName) {
  const schema = Liana.Schemas.schemas[collectioName];

  let detailsFields = [];

  for (let i=0;i<schema.fields.length;i++){
    const field = schema.fields[i];
    if (field.isGraphQL) {
      if (field.reference) {
        const belongsToCollection = field.reference.split('.')[0];
        const schemaReference = Liana.Schemas.schemas[belongsToCollection];
        //TODO: We just need the ref field ... Steve => how can we do it?
        //TODO2:  / FILTER HERE ON FIELDS without REF & isGraphQL / 
        let result = schemaReference.fields.map(field => camelToUnderscore(field.field)); // camelToUnderscore just while we implement the smart collection of the belongsTo
        detailsFields.push(camelToUnderscore(field.field) + ` {  ${result.join(' ')} } ` );
      }
      else {
        detailsFields.push(camelToUnderscore(field.field));
      }
    }
  }
  return detailsFields.join(' ');
}

function generateBelongsToFields(queryBelongsToReferenceField, belongsToCollection) {
  let belongsToFields = 'id';
  if (queryBelongsToReferenceField != 'id') {
    belongsToFields = 'id' + ' ' + camelToUnderscore(queryBelongsToReferenceField);
  }
  return belongsToCollection + ' { ' + belongsToFields + ' } ';;
}

const JSON5 = require('json5');


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
        graphQLFields.push(camelToUnderscore(queryCollectionField));
      }
    }
  }
  return graphQLFields.join(' ');
}
