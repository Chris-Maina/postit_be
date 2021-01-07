const { Model } = require('objection');

class Comment extends Model {
  static get tableName() {
    return 'comments';
  }
  /**
   * A post can have many comments.
   * A comment belongs to a post and a user.
   * A user can add many comments to many posts
   * 
   *  post --- has many ----> comments
   *  comment --- belongs to one ----> post
   *  comment --- belongs to one ----> user
   *  user ---- has many ----> comments 
   */
  static get relationMappings() {
    const User = require('./Users.model');

    return {
      commented_by: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        filter: query => query.select('id', 'first_name', 'last_name', 'email'),
        join: {
          from: 'comments.user_id',
          to: 'users.id'
        }
      },
    }
  }
}

module.exports = Comment;
