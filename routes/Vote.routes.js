const router = require('express').Router();
const createError = require('http-errors');

const Vote = require('../models/Votes.model');
const { DEL_ASYNC } = require('../helpers/init_redis');
const { verifyToken } = require('../helpers/jwt_helper');
const { votingSchema } = require('../helpers/validation_schema');

router.post('/', verifyToken, async (req, res, next) => {
  try {
    const result = await votingSchema.validateAsync({
      user_id: req.payload.id,
      post_id: parseInt(req.body.post_id, 10),
      vote_type: req.body.vote_type
    });
    const { post_id, user_id, vote_type } = result

    const voteQuery = Vote.query();
    const voteExists = await voteQuery.findOne({ post_id, user_id, vote_type });

    if (voteExists) throw createError.Conflict(`You have already voted for the post`);
    const vote = await voteQuery.insert({ post_id, user_id, vote_type });

    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC('posts');

    res.status(201);
    return res.send({
      message: "Successfully voted",
      vote,
    });
  } catch (error) {
    if (error.isJoi) return next(createError.BadRequest("User id,post id and vote type are required"));
    next(error);
  }
});

module.exports = router;