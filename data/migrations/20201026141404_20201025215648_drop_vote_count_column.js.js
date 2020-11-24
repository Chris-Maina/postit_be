
exports.up = function(knex) {
  return knex.schema.table('posts', tbl => {
    tbl.dropColumn('vote_count');
  })
};

exports.down = function(knex) {
  return knex.schema.table('posts', tbl => {
    tbl.integer('vote_count');
  })
};
