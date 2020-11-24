import { SET_ASYNC, GET_ASYNC } from './init_redis';

const addUser = async (user) => {
  const usersResponse = await GET_ASYNC('users');
  const users = usersResponse ? JSON.parse(usersResponse) || [];
  users.push(user);
  await SET_ASYNC('users', users);
}

const removeUser = async userId => {
  const usersResponse = await GET_ASYNC('users');
  const users = JSON.parse(usersResponse).filter(user => user.id !== parseInt(userId, 10));
  await SET_ASYNC('users', JSON.stringify(users));
}

module.exports = {
  addUser,
}