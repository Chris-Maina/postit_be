const { Model } = require('objection');

class Post extends Model {
  static get tableName() {
    return 'posts'
  }
  
  static get relationMappings() {
    const Vote = require('./Votes.model')
    const User = require('./Users.model')
    const Comment = require('./Comments.model');
    return {
      posted_by: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        filter: query => query.select('id', 'first_name', 'last_name', 'email'),
        join: {
          from: 'posts.created_by',
          to: 'users.id'
        }
      },
      votes: {
        relation: Model.HasManyRelation,
        modelClass: Vote,
        join: {
          from: 'posts.id',
          to: 'votes.post_id'
        }
      },
      // voters: {
      //   relation: Model.ManyToManyRelation,
      //   modelClass: User,
      //   join: {
      //     from: 'posts.id',
      //     through: {
      //       from: 'votes.post_id',
      //       to: 'votes.user_id'
      //     },
      //     to: 'votes.post_id'
      //   }
      // },
      comments: {
        relation: Model.HasManyRelation,
        filter: query => query.select('id', 'title', 'created_at'),
        modelClass: Comment,
        join: {
          from: 'posts.id',
          to: 'comments.post_id'
        }
      }
    }
  }
}



module.exports = Post;