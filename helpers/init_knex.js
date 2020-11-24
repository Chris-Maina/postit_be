const Knex = require('knex');
const { Model } = require('objection');

const knexConfig =  require('../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexConfig[env];
const knex = Knex(config);

Model.knex(knex);
