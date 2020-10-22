const cookieParser = require('cookie-parser');
const { RecordSerializer } = require('forest-express-sequelize');
const Liana = require('forest-express-sequelize');
const { request, gql } = require('graphql-request');

const JSON5 = require('json5');


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
      //TODO: dropdown with pagination
      this.listDropdown(req,res,next);
      return;
    }  
    const limit = parseInt(req.query.page.size) || 10;
    const offset = (parseInt(req.query.page.number) - 1) * limit;
  
    const selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);
    let whereGraphQL = buildWhereConditionSearch(req.query.search, COLLECTION_NAME);
    const schema = Liana.Schemas.schemas[COLLECTION_NAME];
    const querySegment = req.query.segment;
    if (querySegment) {
      const segmentArray = schema.segments.filter(segment => segment.name === querySegment);
      if (segmentArray.length === 1 && segmentArray[0].where) {
        whereGraphQL = ` { _and: [${segmentArray[0].where()}, ${whereGraphQL} ] }`;
      }     
    }
    const orderBy = getOrderBy(req.query.sort);
  
  
    const query = gql`
      query get_all_and_count($limit: Int!, $offset: Int!) {
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

  this.listRelationship = async function (req, res, next) {
    const recordId = req.params.recordId;
    const belongsToRelationName = req.params.belongsToRelationName;


    const limit = parseInt(req.query.page.size) || 10;
    const offset = (parseInt(req.query.page.number) - 1) * limit;
  
    const selectFields = getCollectionFields(req.query.fields, belongsToRelationName);

    const schema = Liana.Schemas.schemas[COLLECTION_NAME];
    const foreignKey = schema.fields.filter(field => field.field === belongsToRelationName)[0].foreignKey;
    const whereCondition = { [foreignKey]: { [HASURA_COMPARISONS.eq]: recordId} } ;
    const whereGraphQL = JSON5.stringify(whereCondition, {quote: '"'});
  
    const query = gql`
      query get_all_relationship($limit: Int!, $offset: Int!) {
        ${belongsToRelationName}(limit: $limit, offset: $offset, where: ${whereGraphQL}) {
          ${selectFields}
        }
        ${belongsToRelationName}_aggregate(where: ${whereGraphQL}) {
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
      const recordSerializer = new RecordSerializer({ name: belongsToRelationName });
      const recordsSerialized = await recordSerializer.serialize(data[belongsToRelationName]);
      const count = data[`${belongsToRelationName}_aggregate`].aggregate.count;
      res.send({ ...recordsSerialized, meta:{ count }})
    })
    .catch(next);        
  }

  this.listDropdown = async function (req, res, next) {
    let selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);
    if (selectFields !== 'id') { //TODO: id can be different?
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

  this.listExport  = async function (req, res, next) {

    const limit = parseInt(req.query.page.size) || 10;
    const offset = (parseInt(req.query.page.number) - 1) * limit;
  
    const selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);
    const whereGraphQL = buildWhereConditionSearch(req.query.search, COLLECTION_NAME);
    const orderBy = getOrderBy(req.query.sort);
  
  
    const query = gql`
      query get_all_and_count($limit: Int!, $offset: Int!) {
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
    
    const pkCondition = getPkCondition(ID_FIELD, recordId);

    const query = gql`
      query details {
        ${COLLECTION_NAME}_by_pk(${pkCondition}) {
          ${selectFields}
        }
      }`;
  
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
    attributes = appendRelationshipsAttributes(attributes, req.body.data.relationships, COLLECTION_NAME);

    const setValues = JSON5.stringify(attributes, {quote: '"'});

    const selectFields = getDetailsFields(COLLECTION_NAME);
    const pkCondition = getPkCondition(ID_FIELD, recordId);

    const query = gql`
      mutation update {
        update_${COLLECTION_NAME}_by_pk(pk_columns: {${pkCondition}}, _set: ${setValues}) {
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

  this.delete  = async function (req, res, next) {
    const recordId = req.params.recordId;
    this._deleteRecord(recordId)
    .then((data) => {
      res.status(204).send();
    })
    .catch(next);  
  }

  this.deleteBulk  = async function (req, res, next) {
    let recordIds = req.body.data.attributes.ids;
    for (let recordId of recordIds) {
      try {
        let data = await this._deleteRecord(recordId);
      }
      catch(error) {
        next(error); // TODO: Review this?
        return;
      }
    }
    res.status(204).send();
  }

  this._deleteRecord = async function (recordId) {
    const pkCondition = getPkCondition(ID_FIELD, recordId);

    const query = gql`
      mutation delete {
        delete_${COLLECTION_NAME}_by_pk(${pkCondition}) {
          ${ID_FIELD.split('|').join(' ')}
        }
      }`;
    
    return request(GRAPHQL_URL, query);
  }    

  this.create  = async function (req, res, next) {
    let attributes = req.body.data.attributes || {};
    if (attributes && attributes['__meta__']) delete attributes['__meta__']; //TODO: why do we get this?
    attributes = appendRelationshipsAttributes(attributes, req.body.data.relationships, COLLECTION_NAME);

    const createValues = JSON5.stringify(attributes, {quote: '"'});

    const selectFields = getDetailsFields(COLLECTION_NAME);
  
    const query = gql`
      mutation update {
        insert_${COLLECTION_NAME}_one(object: ${createValues}) {
          ${selectFields}
        }
      }`;
  
    request(GRAPHQL_URL, query).then((data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      let record = data[`insert_${COLLECTION_NAME}_one`];
      if (ID_FIELD !== 'id') {
        // id is required to be serialized
        const idComposed = ID_FIELD.split('|');
        let recordId=record[idComposed[0]];
        for (let i = 1;i<idComposed.length;i++) {
          recordId = recordId + '|' + record[idComposed[i]];
        }
        record.id = recordId;
      }
      return recordSerializer.serialize(record);
    })
    .then(recordsSerialized => res.send(recordsSerialized))
    .catch(next);
  
  }

}

function getPkCondition(idField, recordId) {
  const idComposed = idField.split('|');
  const recordIdComposed = recordId.split('|');
  let pkCondition = `${idComposed[0]}: "${recordIdComposed[0]}"`;
  for (let i=1; i<idComposed.length;i++) {
    pkCondition = pkCondition + ', ' + `${idComposed[i]}: "${recordIdComposed[i]}"`
  }
  return pkCondition;
}
function appendRelationshipsAttributes(attributes, relationships, collectioName) {
  if (!relationships) return attributes;
  for (const [key, value] of Object.entries(relationships)) {
    //console.log(`${key}: ${value}`);
    const schema = Liana.Schemas.schemas[collectioName];
    const foreignKey = schema.fields.filter(field => field.field === key)[0].foreignKey;
    attributes[camelToUnderscore(foreignKey)] = value.data.id; //TODO: id field might be different for orders?
  }
  return attributes;
}

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

function buildWhereConditionSearch (search, collectioName) {
  const schema = Liana.Schemas.schemas[collectioName];

  let whereCondition = {};
  if (search) {
    let wcArray = whereCondition[HASURA_OPERATORS.or] = [];
    for (let i=0;i<schema.fields.length;i++){
      const field = schema.fields[i];
      if (field.isNotGraphQLField) continue;
      if (field.reference) {
        //TODO: Extended search !!
        //wcArray.push({ [???]: { [HASURA_COMPARISONS.ilike]: '%' + search + '%'} });
      }
      else {
        const whereCondition = getWhereCondition(field, search);
        if (whereCondition) wcArray.push(whereCondition);
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
      if (isNaN(search)) return;
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
    if (field.isNotGraphQLField) continue;
    if (Array.isArray(field.type)) continue; // do not load hasMany relationships
    if (field.reference) {
      const belongsToCollection = field.reference.split('.')[0];
      const schemaReference = Liana.Schemas.schemas[belongsToCollection];
      //TODO: We just need the ref field ... Steve => how can we do it?
      let result = schemaReference.fields.map(field => {
        if (Array.isArray(field.type) || field.isNotGraphQLField) return; // do not load hasMany relationships or Not GraphQL Field
        // camelToUnderscore just while we implement the smart collection of the belongsTo
        return camelToUnderscore(field.field);
      }); 
      detailsFields.push(camelToUnderscore(field.field) + ` {  ${result.join(' ')} } ` );
    }
    else {
      detailsFields.push(camelToUnderscore(field.field));
    }
  }
  return detailsFields.join(' ');
}

function generateBelongsToFields(queryBelongsToReferenceField, belongsToCollection) {
  let belongsToFields = 'id';
  if (queryBelongsToReferenceField != 'id') { // This id can be different?
    belongsToFields = 'id' + ' ' + camelToUnderscore(queryBelongsToReferenceField);
  }
  return belongsToCollection + ' { ' + belongsToFields + ' } ';;
}

function getCollectionFields(queryFields, collectioName) {

  const schema = Liana.Schemas.schemas[collectioName];
  
  let queryCollectionFields = queryFields[collectioName].split(',');
  let graphQLFields = [];
  for (let i =0; i<queryCollectionFields.length; i++) {
    const queryCollectionField = queryCollectionFields[i];
    const field = schema.fields.filter(item => item.field === queryCollectionField)[0];
    if (field.isNotGraphQLField) continue;
    if (field.reference) {
      //console.log(field);
      let belongsToFields = generateBelongsToFields(queryFields[field.field], field.field);
      graphQLFields.push(belongsToFields);
    }
    else {
      graphQLFields.push(camelToUnderscore(queryCollectionField));
    }
  }
  return graphQLFields.join(' ');
}

module.exports = ForestHasura;
