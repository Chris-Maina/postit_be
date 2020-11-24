const { Model } = require('objection');

class Vote extends Model {
  static get tableName() {
    return 'votes';
  }
}

module.exports = Vote;
