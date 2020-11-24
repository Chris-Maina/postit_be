const { onUpdateTrigger } = require('../../knexfile');

exports.up = function(knex) {
  return knex.schema.createTable('votes', tbl => {
    tbl.increments();
    tbl.dateTime('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    tbl.dateTime('updated_at');
    tbl.enu('vote_type', [1, 0], { useNative: true, enumName: 'vote_type' });
  })
  .then(() => knex.raw(onUpdateTrigger('votes')))
};

exports.down = function(knex) {
  return knex.schema.dropTable('votes');
};
