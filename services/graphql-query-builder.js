// const JSON5 = require('json5');

function GraphQlQueryBuilder(opts) {
  // TODO: collectionName as a parameter?

  const {
    graphqlQuery, selectBuilder, whereBuilder, orderByBuilder,
  } = opts;

  this.getAll = async function fn(req, res, next) {
    next();
  };

  this.get = async function fn(req, res, next) {
    next();
  };

  this.create = async function fn(req, res, next) {
    next();
  };

  this.update = async function fn(req, res, next) {
    next();
  };

  this.remove = async function fn(req, res, next) {
    next();
  };

  this.removeBulk = async function fn(req, res, next) {
    next();
  };
}

module.exports = GraphQlQueryBuilder;
