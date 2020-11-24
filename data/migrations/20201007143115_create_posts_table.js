const { onUpdateTrigger } = require('../../knexfile');

exports.up = function(knex) {
  return knex.schema.createTable('posts', tbl => {
    tbl.increments();
    tbl.string('title');
    tbl.integer('vote_count');
    tbl.dateTime('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    tbl.dateTime('updated_at');
  })
  .then(() => knex.raw(onUpdateTrigger('posts')))
}

exports.down = function(knex) {
  return knex.schema.dropTable('posts')
}
