const bycrpt = require('bcrypt');
const { Model } = require('objection');

class User extends Model {
  static get tableName() {
    return 'users'
  }

  static validatePassword(password, hash) {
    return bycrpt.compare(password, hash);
  }

  static passwordHash(password) {
    return bycrpt.hash(password, 10);
  } 

  static getUser(user){
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    }
  };
  
  static get relationMappings() {
    const Post = require('./Posts.model')
    return {
      posts: {
        relation: Model.HasManyRelation,
        modelClass: Post,
        join: {
          from: 'users.id',
          to: 'posts.created_by'
        }
      },
      // posts_with_votes: {
      //   relation: Model.ManyToManyRelation,
      //   modelClass: Post,
      //   join: {
      //     from: 'users.id',
      //     through: {
      //       from: 'votes.user_id',
      //       to: 'votes.post_id'
      //     },
      //     to: 'posts.id'
      //   }
      // }
    }
  }
}

module.exports = User;
