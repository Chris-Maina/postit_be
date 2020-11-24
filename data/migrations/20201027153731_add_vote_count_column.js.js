exports.up = function(knex) {
  /* Add a view with posts and vote count  */
  return knex.schema.raw(`
    CREATE VIEW posts_with_votes AS
    SELECT posts.id,
      posts.title,
      posts.created_at,
      posts.updated_at,
      posts.created_by,
      coalesce(SUM(votes.vote_type::int), 0) as vote_count
    FROM posts
    LEFT JOIN votes on posts.id = votes.post_id
    GROUP BY posts.id
  `)
};

exports.down = function(knex) {
  return knex.schema.raw('DROP VIEW posts_with_votes')
};
