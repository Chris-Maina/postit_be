// load env variables
require('dotenv').config()

module.exports = {

  development: {
    client: 'pg',
    connection: process.env.DATABASE_URI,
    migrations: {
      directory: './data/migrations'
    },
  },

  staging: {
    client: 'pg',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URI,
    migrations: {
      directory: './data/migrations'
    },
  },
  /* Helper method to update updated_at column using on_update_timestamp procedure */
  onUpdateTrigger: table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    EXECUTE PROCEDURE ${table}.on_update_timestamp();
  `
};
