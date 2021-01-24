const router = require('express').Router();
const createError = require('http-errors');

const Post = require('../models/Posts.model');
const { verifyToken } = require('../helpers/jwt_helper');
const { broadcast } = require('../helpers/websocket_helpers');
const { ADD_POST, UPDATE_POST, DELETE_POST } = require('../constants');
const { GET_ASYNC, SET_ASYNC, DEL_ASYNC } = require('../helpers/init_redis');
const { postSchema, updatePostSchema } = require('../helpers/validation_schema');

/* Middleware */
postsCache =  async (req, res, next) => {
  try {
    const response = await GET_ASYNC('posts');
    if (response !== null) {
      res.status(200);
      res.send(JSON.parse(response));
    } else {
      next();
    }
  } catch (error) { 
    next(error);
  }
}

/**
 * Fetch data from cache. If cache-hit return data
 * If cache miss, query DB and add to cache
 * 
 */
router.get('/', postsCache, async (req, res, next) => {
  try {
    const response = await Post.query()
      .select([
        'posts.id',
        'posts.title',
        'posts.created_at',
        'posts.updated_at',
      ])
      .orderBy('created_at', 'desc')      
      .withGraphFetched({
        posted_by: true,
        votes: true,
        comments: {
          commented_by: true
        }
      })

    // cache data for 1min
    await SET_ASYNC('posts', JSON.stringify(response), 'EX', 60);

    res.status(200);
    res.send(response);
  } catch (error) {
    next(error);
  } 
});


router.post('/', verifyToken, async (req, res, next) => {
  try {
    const result = await postSchema.validateAsync({ 
      ...req.body,
      created_by: req.payload.id
    });

    const post = await Post.query().insert(result); 
    const postWithRelations = await Post.query()
      .findById(post.id)
      .select([
        'posts.id',
        'posts.title',
        'posts.created_at',
        'posts.updated_at',
      ])
      .withGraphFetched({
        posted_by: true,
        votes: true,
        comments: {
          commented_by: true
        }
      })

    // broad cast to connected clients
    broadcast(req.app.locals.clients, postWithRelations, ADD_POST);

     // Cache Invalidation: del-cache-on-update 
     await DEL_ASYNC('posts');

    res.status(201);
    res.send({ message: 'Successfully added post' });
  } catch (error) {
    if (error.isJoi) return next(createError.BadRequest("Title and created by are required"));
    next(error);
  } 
});

router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    let reqBody = req.body;
    if (!reqBody.id) {
      reqBody = {
        ...reqBody,
        id: parseInt(req.params.id, 10)
      }
    } 

    await updatePostSchema.validateAsync(reqBody);
    await Post.query().findById(reqBody.id).update(reqBody);
    const response = await Post.query()
      .findById(reqBody.id)
      .select([
        'posts.id',
        'posts.title',
        'posts.created_at',
        'posts.updated_at',
        // Post.relatedQuery('votes').select(raw('coalesce(SUM(vote_type::int), 0)')).as('vote_count')
      ])
      .withGraphFetched({
        posted_by: true,
        votes: true,
        comments: {
          commented_by: true
        }
      })
     
    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC('posts');

    // broad cast to connected clients
    broadcast(req.app.locals.clients, response, UPDATE_POST);

    res.status(200);
    res.send({ message: 'Successfully updated post' });
  } catch (error) {
    if (error.isJoi) return next(createError.BadRequest("Post id is required"));
    next(error);
  } 
});

router.patch('/:id', verifyToken, async (req, res, next) => {
  try {
    let reqBody = req.body;
    if (!reqBody.id) {
      reqBody = {
        ...reqBody,
        id: parseInt(req.params.id, 10)
      }
    } 

    await updatePostSchema.validateAsync(reqBody);
    await Post.query().findById(reqBody.id).patch(reqBody);
    const response = await Post.query()
      .findById(reqBody.id)
      .select([
        'posts.id',
        'posts.title',
        'posts.created_at',
        'posts.updated_at',
        // Post.relatedQuery('votes').select(raw('coalesce(SUM(vote_type::int), 0)')).as('vote_count')
      ])
      .withGraphFetched({
        posted_by: true,
        votes: true,
        comments: {
          commented_by: true
        }
      })

    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC('posts');

    // broad cast to connected clients
    broadcast(req.app.locals.clients, response, UPDATE_POST);

    res.status(200);
    res.send({ message: 'Successfully updated post' });
  } catch (error) {
    console.log('error', error)
    if (error.isJoi) return next(createError.BadRequest("Post id is required"));
    next(error);
  } 
});

router.delete('/:id', verifyToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    await Post.query().deleteById(id);

    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC('posts');
    // broad cast to connected clients
    broadcast(req.app.locals.clients, { id }, DELETE_POST);

    res.status(200);
    res.send({
      message: 'Successfully deleted post'
    });
  } catch (error) {
    next(error);
  } 
});


module.exports = router;
