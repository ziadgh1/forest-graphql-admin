/* eslint-disable no-plusplus */
/* eslint no-use-before-define: ["error", { "functions": false }] */
const { RecordSerializer } = require('forest-express-sequelize');
const Liana = require('forest-express-sequelize');
const { request, gql } = require('graphql-request');
const JSON5 = require('json5');
const { HASURA_EXP, HASURA_OP } = require('./constants');

function getCollectionFields(queryFields, collectioName) {
  const schema = Liana.Schemas.schemas[collectioName];

  const queryCollectionFields = queryFields[collectioName].split(',');
  // eslint-disable-next-line prefer-const
  let graphQLFields = [];
  for (let i = 0; i < queryCollectionFields.length; i++) {
    const queryCollectionField = queryCollectionFields[i];
    const field = schema.fields.filter((item) => item.field === queryCollectionField)[0];
    // eslint-disable-next-line no-continue
    if (field.isNotGraphQLField) continue;

    if (field.reference) {
      const belongsToFields = generateBelongsToFields(queryFields[field.field], field.field);
      graphQLFields.push(belongsToFields);
    } else {
      graphQLFields.push(camelToUnderscore(queryCollectionField));
    }
  }
  return graphQLFields.join(' ');
}

function ForestHasura(collectionName, graphqlURL, idField) {
  const COLLECTION_NAME = collectionName;
  const GRAPHQL_URL = graphqlURL;
  const ID_FIELD = idField || 'id';

  this.list = async function fn(req, res, next) {
    if (req.query.context) {
      // TODO: dropdown with pagination
      this.listDropdown(req, res, next);
      return;
    }
    const limit = parseInt(req.query.page.size, 10) || 10;
    const offset = (parseInt(req.query.page.number, 10) - 1) * limit;

    const selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);
    let whereGraphQL = buildWhereConditionSearch(req.query.search, COLLECTION_NAME);
    const schema = Liana.Schemas.schemas[COLLECTION_NAME];
    const querySegment = req.query.segment;
    if (querySegment) {
      const segmentArray = schema.segments.filter((s) => s.name === querySegment);
      if (segmentArray.length === 1 && segmentArray[0].where) {
        whereGraphQL = ` { ${HASURA_OP.and}: [${segmentArray[0].where()}, ${whereGraphQL} ] } `;
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
      offset,
    };

    request(GRAPHQL_URL, query, variables).then(async (data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      const recordsSerialized = await recordSerializer.serialize(data[COLLECTION_NAME]);
      const { count } = data[`${COLLECTION_NAME}_aggregate`].aggregate;
      res.send({ ...recordsSerialized, meta: { count } });
    })
      .catch(next);
  };

  this.listRelationship = async function fn(req, res, next) {
    const { recordId, belongsToRelationName } = req.params;

    const limit = parseInt(req.query.page.size, 10) || 10;
    const offset = (parseInt(req.query.page.number, 10) - 1) * limit;

    const selectFields = getCollectionFields(req.query.fields, belongsToRelationName);

    const schema = Liana.Schemas.schemas[COLLECTION_NAME];
    const { foreignKey } = schema.fields.filter((f) => f.field === belongsToRelationName)[0];
    const whereCondition = { [foreignKey]: { [HASURA_EXP.eq]: recordId } };
    const whereGraphQL = JSON5.stringify(whereCondition, { quote: '"' });

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
      offset,
    };

    request(GRAPHQL_URL, query, variables).then(async (data) => {
      const recordSerializer = new RecordSerializer({ name: belongsToRelationName });
      const recordsSerialized = await recordSerializer.serialize(data[belongsToRelationName]);
      const { count } = data[`${belongsToRelationName}_aggregate`].aggregate;
      res.send({ ...recordsSerialized, meta: { count } });
    })
      .catch(next);
  };

  this.listDropdown = async function fn(req, res, next) {
    let selectFields = getCollectionFields(req.query.fields, COLLECTION_NAME);
    if (selectFields !== 'id') {
      selectFields = `${ID_FIELD} ${selectFields}`;
    }

    const whereField = `${req.query.fields[COLLECTION_NAME]}`;
    const { search } = req.query;
    const schema = Liana.Schemas.schemas[COLLECTION_NAME];
    const field = schema.fields.filter((f) => f.field === whereField)[0];

    const whereCondition = getWhereConditionField(field, search);

    const whereGraphQL = JSON5.stringify(whereCondition, { quote: '"' });

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
    }).catch(next);
  };

  // eslint-disable-next-line no-unused-vars
  this.listExport = async function fn(_req, _res, _next) {
    // TODO: export CSV
  };

  this.details = async function fn(req, res, next) {
    const { recordId } = req.params;
    if (recordId === 'count') return; // bug?
    const selectFields = getDetailsFields(COLLECTION_NAME);

    const query = gql`
      query details {
        ${COLLECTION_NAME}_by_pk(${ID_FIELD}: "${recordId}") {
          ${selectFields}
        }
      }`;

    request(GRAPHQL_URL, query).then((data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      return recordSerializer.serialize(data[`${COLLECTION_NAME}_by_pk`]);
    })
      .then((recordsSerialized) => res.send(recordsSerialized))
      .catch(next);
  };

  this.update = async function fn(req, res, next) {
    const { recordId } = req.params;
    let { attributes } = req.body.data;
    attributes = appendRelationshipsAttributes(
      attributes,
      req.body.data.relationships,
      COLLECTION_NAME,
    );

    const setValues = JSON5.stringify(attributes, { quote: '"' });

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
      .then((recordsSerialized) => res.send(recordsSerialized))
      .catch(next);
  };

  this.delete = async function fn(req, res, next) {
    const { recordId } = req.params;
    this.deleteRecord(recordId)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  };

  this.deleteBulk = async function fn(req, res, next) {
    const recordIds = req.body.data.attributes.ids;
    // eslint-disable-next-line no-restricted-syntax
    for (const recordId of recordIds) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.deleteRecord(recordId);
      } catch (error) {
        next(error);
        return;
      }
    }
    res.status(204).send();
  };

  this.deleteRecord = async function fn(recordId) {
    const query = gql`
      mutation delete {
        delete_${COLLECTION_NAME}_by_pk(${ID_FIELD}: "${recordId}") {
          ${ID_FIELD}
        }
      }`;
    return request(GRAPHQL_URL, query);
  };

  this.create = async function fn(req, res, next) {
    let { attributes } = req.body.data;
    // eslint-disable-next-line dot-notation
    delete attributes['__meta__'];
    attributes = appendRelationshipsAttributes(
      attributes,
      req.body.data.relationships,
      COLLECTION_NAME,
    );

    const createValues = JSON5.stringify(attributes, { quote: '"' });

    const selectFields = getDetailsFields(COLLECTION_NAME);

    const query = gql`
      mutation update {
        insert_${COLLECTION_NAME}_one(object: ${createValues}) {
          ${selectFields}
        }
      }`;

    request(GRAPHQL_URL, query).then((data) => {
      const recordSerializer = new RecordSerializer({ name: COLLECTION_NAME });
      const record = data[`insert_${COLLECTION_NAME}_one`];
      if (ID_FIELD !== 'id') {
        // id is required to be serialized
        record.id = record[ID_FIELD];
      }
      return recordSerializer.serialize(record);
    })
      .then((recordsSerialized) => res.send(recordsSerialized))
      .catch(next);
  };
}

function appendRelationshipsAttributes(attributes, relationships, collectioName) {
  if (!relationships) return attributes;
  // eslint-disable-next-line prefer-const
  let attributesResult = attributes || {};
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(relationships)) {
    const schema = Liana.Schemas.schemas[collectioName];
    const { foreignKey } = schema.fields.filter((field) => field.field === key)[0];
    // TODO: id field might be different for orders?
    attributesResult[camelToUnderscore(foreignKey)] = value.data.id;
  }
  return attributesResult;
}

function getOrderBy(sort) {
  let sortGraphQL = sort;
  let direction = 'asc';
  if (sortGraphQL) {
    if (sortGraphQL[0] === '-') {
      sortGraphQL = sortGraphQL.substring(1);
      direction = 'desc';
    }
    if (sortGraphQL.includes('.')) {
      const split = sortGraphQL.split('.');
      return `{ ${split[0]}: { ${split[1]}:  ${direction}} }`;
    }
    return `{ ${sortGraphQL}:  ${direction} }`;
  }
  return '{}';
}

function buildWhereConditionSearch(search, collectioName) {
  const schema = Liana.Schemas.schemas[collectioName];

  let whereCondition = {};
  // eslint-disable-next-line prefer-const
  let wcArray = [];
  if (search) {
    for (let i = 0; i < schema.fields.length; i++) {
      const field = schema.fields[i];
      // eslint-disable-next-line no-continue
      if (field.isNotGraphQLField) continue;
      if (field.reference) {
        // TODO: Extended search !!
      } else {
        const whereConditionField = getWhereConditionField(field, search);
        if (whereConditionField) {
          wcArray.push(whereConditionField);
        }
      }
    }
    whereCondition = { [HASURA_OP.or]: wcArray };
  }
  return JSON5.stringify(whereCondition, { quote: '"' }); // GraphQL expect " for strings and no ' or " for keys
}

function getWhereConditionField(field, search) {
  switch (field.type) {
    case 'String':
      return { [camelToUnderscore(field.field)]: { [HASURA_EXP.ilike]: `%${search}%` } };
    case 'Number':
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(search)) return null;
      return { [camelToUnderscore(field.field)]: { [HASURA_EXP.eq]: search } };
    default:
      return null;
  }
}

function camelToUnderscore(key) {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.split(' ').join('_').toLowerCase();
}

function getDetailsFields(collectioName) {
  const schema = Liana.Schemas.schemas[collectioName];

  // eslint-disable-next-line prefer-const
  let detailsFields = [];

  for (let i = 0; i < schema.fields.length; i++) {
    const field = schema.fields[i];
    // eslint-disable-next-line no-continue
    if (field.isNotGraphQLField || Array.isArray(field.type)) continue;
    if (field.reference) {
      const belongsToCollection = field.reference.split('.')[0];
      const schemaReference = Liana.Schemas.schemas[belongsToCollection];
      // TODO: We just need the ref field ... Steve => how can we do it?
      const result = schemaReference.fields.map((f) => {
        // do not load hasMany relationships or Not GraphQL Field
        if (Array.isArray(f.type) || f.isNotGraphQLField) return null;
        // camelToUnderscore just while we implement the smart collection of the belongsTo
        return camelToUnderscore(f.field);
      });
      detailsFields.push(`${camelToUnderscore(field.field)} { ${result.join(' ')} } `);
    } else {
      detailsFields.push(camelToUnderscore(field.field));
    }
  }
  return detailsFields.join(' ');
}

function generateBelongsToFields(queryBelongsToReferenceField, belongsToCollection) {
  let belongsToFields = 'id';
  if (queryBelongsToReferenceField !== 'id') { // This id can be different?
    belongsToFields = `${'id'} ${camelToUnderscore(queryBelongsToReferenceField)}`;
  }
  return `${belongsToCollection} { ${belongsToFields} } `;
}

module.exports = ForestHasura;
