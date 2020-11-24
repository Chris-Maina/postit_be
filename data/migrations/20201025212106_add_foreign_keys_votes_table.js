
exports.up = function(knex) {
  return knex.schema.table('votes', tbl => {
    tbl.integer('post_id').references('posts.id').onDelete('CASCADE').onUpdate('CASCADE');
    tbl.integer('user_id').references('users.id').onDelete('CASCADE').onUpdate('CASCADE');
  })
};

exports.down = function(knex) {
  return knex.schema.table('votes', tbl => {
    tbl.dropColumn('post_id');
    tbl.dropColumn('user_id');
  });
};
