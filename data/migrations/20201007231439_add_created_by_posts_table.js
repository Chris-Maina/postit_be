
exports.up = function(knex) {
  return knex.schema.table('posts', tbl => {
    tbl.integer('created_by').references('users.id').onDelete('CASCADE').onUpdate('CASCADE');
  })
};

exports.down = function(knex) {
  return knex.schema.table('posts', tbl => {
    tbl.dropColumn('created_by')
});
};
