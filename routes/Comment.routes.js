const router = require('express').Router();
const createError = require('http-errors');
const { DEL_ASYNC } = require('../helpers/init_redis');
const { verifyToken } = require('../helpers/jwt_helper');
const { commentSchema, updateCommentSchema } = require('../helpers/validation_schema');
const Comment = require('../models/Comments.model');

router.post('/', verifyToken, async (req, res, next) => {
  try {
    const result = await commentSchema.validateAsync({
      ...req.body,
      user_id: req.payload.id
    });

    const commentQuery = Comment.query();
    const comment = await commentQuery.insert(result);
    const commentWithRelations = await Comment.query()
      .findById(comment.id)
      .select([
        'comments.id',
        'comments.title',
        'comments.created_at',
      ])
      .withGraphFetched('commented_by');

    // Add Posts Cache Invalidation
    await DEL_ASYNC('posts');

    res.status(201);
    return res.send(commentWithRelations)
  } catch (error) {
    if (error.isJoi) return next(createError.BadRequest("Title and post id are required"));
    next(error);
  }
});

router.patch('/:id', verifyToken, async (req, res, next) => {
  try {
    const result = await updateCommentSchema.validateAsync({
      ...req.body,
      id: parseInt(req.params.id, 10),
      user_id: req.payload.id
    });
    await Comment.query().findById(result.id).patch(result);
    const response = await Comment.query()
      .findById(result.id)
      .select([
        'comments.id',
        'comments.title',
        'comments.created_at',
      ])
      .withGraphFetched('commented_by');

    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC('posts');

    res.status(200);
    res.send(response)
  } catch (error) {
    if (error.isJoi) return next(createError.BadRequest());
    next(error);
  }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    await Comment.query().deleteById(id);

    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC('posts');

    res.status(200);
    res.send({
      message: 'Successfully deleted comment'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
