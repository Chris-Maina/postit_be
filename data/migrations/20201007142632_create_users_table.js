const { onUpdateTrigger } = require('../../knexfile');

exports.up = function(knex) {
  return knex.schema.createTable("users", tbl => {
    tbl.increments();
    tbl.string('first_name');
    tbl.string('last_name');
    tbl.string('email');
    tbl.dateTime('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    tbl.dateTime('updated_at');
  })
  .then(() => knex.raw(onUpdateTrigger('users')))
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
