const router = require('express').Router();
const createError = require('http-errors');

const Post = require('../models/Posts.model');
const { verifyToken } = require('../helpers/jwt_helper');
const { broadcast } = require('../helpers/websocket_helpers');
const { ADD_POST, UPDATE_POST, DELETE_POST } = require('../constants');
const { GET_ASYNC, DEL_ASYNC } = require('../helpers/init_redis');
const { postSchema, updatePostSchema } = require('../helpers/validation_schema');

router.get('/', async (req, res, next) => {
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

    const response = await Post
      .query()
      .insert(result)
      .returning('id', 'title', 'created_at', 'updated_at')
      .withGraphFetched({
        posted_by: true,
        votes: true,
        comments: {
          commented_by: true
        }
      });

    // broad cast to connected clients
    broadcast(req.app.locals.clients, response, ADD_POST);

    res.status(201);
    res.send({ message: 'Successfully added post' });

    // Cache Invalidation on user: del-cache-on-update 
    await DEL_ASYNC(req.payload.id);
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
    const response = await Post
      .query()
      .update(reqBody)
      .where('id', reqBody.id)
      .returning('id', 'title', 'created_at', 'updated_at')
      .first()
      .withGraphFetched({
        posted_by: true,
        votes: true,
        comments: {
          commented_by: true
        }
      });
  
    // broad cast to connected clients
    broadcast(req.app.locals.clients, response, UPDATE_POST);

    res.status(200);
    res.send({ message: 'Successfully updated post' });

    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC(req.payload.id);
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
    const response = await Post
      .query()
      .patch(reqBody)
      .where('id', reqBody.id)
      .returning('id', 'title', 'created_at', 'updated_at')
      .first()
      .withGraphFetched({
        posted_by: true,
        votes: true,
        comments: {
          commented_by: true
        }
      });

    // broadcast to connected clients
    broadcast(req.app.locals.clients, response, UPDATE_POST);

    res.status(200);
    res.send({ message: 'Successfully updated post' });
  
    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC(req.payload.id);
  } catch (error) {
    if (error.isJoi) return next(createError.BadRequest("Post id is required"));
    next(error);
  } 
});

router.delete('/:id', verifyToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    await Post.query().deleteById(id);
    // broad cast to connected clients
    broadcast(req.app.locals.clients, { id }, DELETE_POST);

    res.status(200);
    res.send({
      message: 'Successfully deleted post'
    });

    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC(req.payload.id);
  } catch (error) {
    next(error);
  } 
});


module.exports = router;
