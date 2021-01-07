
exports.up = function(knex) {
  return knex.schema.table('comments', tbl => {
    tbl.integer('user_id').references('users.id').onDelete('CASCADE').onUpdate('CASCADE');
    tbl.integer('post_id').references('posts.id').onDelete('CASCADE').onUpdate('CASCADE');
  })
};

exports.down = function(knex) {
  return knex.schema.table('comments', tbl => {
    tbl.dropColumn('user_id');
    tbl.dropColumn('post_id');
  });
};
