
exports.up = async function (knex) {
  await knex.schema.raw(`DROP TYPE vote_type cascade`);
  return knex.schema.table('votes', tbl => {
    tbl.enu('vote_type', [1, -1]);
  });
};

exports.down = async function (knex) {
  await knex.schema.table('votes', tbl => {
    tbl.dropColumn('vote_type');
  });
  return knex.schema.table('votes', tbl => {
    tbl.enu('vote_type', [1, 0], { useNative: true, enumName: 'vote_type' });
  })
};
