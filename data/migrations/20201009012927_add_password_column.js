
exports.up = function(knex) {
  return knex.schema.table('users', tbl => {
    tbl.string('password')
  })
};

exports.down = function(knex) {
  return knex.schema.table('users', tbl => {
    tbl.dropColumn('password')
  })
};
