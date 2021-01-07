const { onUpdateTrigger } = require("../../knexfile");

exports.up = function(knex) {
  return knex.schema.createTable("comments", tbl => {
    tbl.increments();
    tbl.string('title');
    tbl.dateTime('created_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    tbl.dateTime('updated_at');
  })
  .then(() => knex.raw(onUpdateTrigger('comments')))
};

exports.down = function(knex) {
  return knex.schema.dropTable('comments')
};
