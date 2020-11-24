const redis = require('redis');
const { promisify } = require('util');

const redisCient = redis.createClient(process.env.REDIS_PORT);

redisCient.on('connect', () => console.log('Connecting to redis...'));
redisCient.on('ready', () => console.log('Connected to redis and ready to use...'));
redisCient.on('error', (err) => console.error(err.message));
redisCient.on('end', () => console.log('Disconnected from redis'));
process.on('SIGINT', () => redisCient.quit());

const GET_ASYNC = promisify(redisCient.get).bind(redisCient);
const SET_ASYNC = promisify(redisCient.set).bind(redisCient);
const DEL_ASYNC = promisify(redisCient.del).bind(redisCient);

module.exports = {
  redisCient,
  GET_ASYNC,
  SET_ASYNC,
  DEL_ASYNC,
};
