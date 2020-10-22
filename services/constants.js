const HASURA_OP = {
  and: '_and',
  or: '_or',
  not: '_not',

};

const HASURA_EXP = {
  eq: '_eq',
  neq: '_neq',
  gt: '_gt',
  gte: '_gte',
  isnull: '_is_null',
  lt: '_lt',
  ilike: '_ilike',
  like: '_like',
  nilike: '_nilike',
  nlike: '_nlike',
};

module.exports = {
  HASURA_OP,
  HASURA_EXP,
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
