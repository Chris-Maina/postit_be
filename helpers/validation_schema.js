const Joi = require('joi');

const authSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(5).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(5).required(),
});

const votingSchema = Joi.object({
  post_id: Joi.number().required(),
  user_id: Joi.number().required(),
  vote_type: Joi.required(),
});

const postSchema = Joi.object({
  title: Joi.string().required(),
  created_by: Joi.number().required(),
});

const updatePostSchema = Joi.object({
  id: Joi.number().required(),
  title: Joi.string(),
  updated_at: Joi.optional(),
  created_at: Joi.optional(),
  created_by: Joi.optional(),
});


module.exports = {
  authSchema,
  loginSchema,
  votingSchema,
  postSchema,
  updatePostSchema,
}
