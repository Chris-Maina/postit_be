const createError = require('http-errors');
const router = require('express').Router();

const {
  verifyToken,
  generateToken,
  verifyRefreshToken,
  generateRefreshToken,
} = require('../helpers/jwt_helper');
const User = require('../models/Users.model');
const { authSchema, loginSchema } = require('../helpers/validation_schema');
const { GET_ASYNC, DEL_ASYNC, SET_ASYNC } = require('../helpers/init_redis');

/* Middleware */
usersCache =  async (req, res, next) => {
  let id = null;
  try {
    if (req.params.id) {
      id = req.params.id
    } else {
      id = req.payload.id
    }
    const response = await GET_ASYNC(id);
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

router.post('/register', async (req, res, next) => {
  try {
    const result = await authSchema.validateAsync(req.body);
    const { first_name, last_name, email, password } = result;
    
    const userQuery = User.query();
    const userExists = await userQuery.findOne({ email });
    if (userExists) throw createError.Conflict(`${email} has already been taken`);

    
    const hashedPassword = await User.passwordHash(password);
    const response = await userQuery.insert({
      email,
      last_name,
      first_name,
      password: hashedPassword,
    })
    .returning('id', 'email', 'first_name', 'last_name');
    

    res.status(201);
    return res.send(response);
  } catch (error) {
    if (error.isJoi) error.status = 422;
    next(error);
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const result = await loginSchema.validateAsync(req.body);
    const { email, password } = result;

    const userRes = await User
      .query()
      .findOne({ email })
      .returning('id', 'email', 'first_name', 'last_name', 'password');
    if (!userRes) throw createError.NotFound(`User is not registered`);
    
    const isPasswordValid = await User.validatePassword(password, userRes.password);
    if (!isPasswordValid) throw createError.Unauthorized("Email/password is invalid");

    const token = await generateToken(userRes.id);
    await generateRefreshToken(userRes.id, res);

    res.status(200);
    delete userRes.password
    return res.send({
      ...userRes,
      access_token: token,
    });
  } catch (error) {
    if (error.isJoi) return next(createError.BadRequest("Email/password is not valid"));
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const response = await User.query()
      .select('id', 'email', 'first_name', 'last_name')
      .withGraphFetched('posts.votes');

    res.status(200);
    return res.send(response)
  } catch (error) {
    next(error);
  }
});

/**
 * Fetch data from cache. If cache-hit return data
 * If cache miss, query DB and add to cache
 *
 */
router.get('/user/:id', verifyToken, usersCache, async (req, res, next) => {
  let id = null;
  try {
    if (req.params.id) {
      id = req.params.id
    } else {
      id = req.payload.id
    }
    const response = await User.query()
      .findById(id)
      .select('id', 'email', 'first_name', 'last_name')
      .withGraphFetched('posts.votes');
    if (!response) return next(createError.NotFound());

    // cache data for 1min
    await SET_ASYNC(id.toString(), JSON.stringify(response), 'EX', 60);

    res.status(200);
    return res.send(response)
  } catch (error) {
    next(error);
  }
});

router.patch('/user/:id', verifyToken, async (req, res, next) => {
  const { id } = req.params;
  let user = null;
  try {
    // GET user from cache
    user = await GET_ASYNC(id);

    const userQuery = User.query();
    if (!user) {
      user = await userQuery.findById(id);
    }
    if (!user) return next(createError.NotFound());
    
    const response = await userQuery
      .patch(req.body)
      .where('id', id)
      .returning('id', 'email', 'first_name', 'last_name')
      .first()
      .withGraphFetched('posts.votes');


    //  Cache Invalidation: del-cache-on-update
    await DEL_ASYNC(id)
    res.status(200);
    return res.send(response);
  } catch (error) {
    next(error);
  }
});

router.put('/user/:id', verifyToken, async (req, res, next) => {

  let id  = null;
  let user = null;
  try {
    if (req.params.id) {
      id = req.params.id
    } else {
      id = req.payload.id
    }
    const userQuery = User.query();

    user = await GET_ASYNC(id);
    if (!user) {
      user = await userQuery.findById(id);
    }
    if (!user) return next(createError.NotFound());
    
    const response = await userQuery
      .update(req.body)
      .where('id', id)
      .returning('id', 'email', 'first_name', 'last_name')
      .first()
      .withGraphFetched('posts.votes');

    // Cache Invalidation: del-cache-on-update 
    await DEL_ASYNC(id);

    res.status(200);
    res.send(response)
  } catch (error) {
    next(error);
  }
});


router.get('/refresh-token', async(req, res, next) => {
  try {
    const cookieArr = req.headers.cookie.split('=');
    const refreshTokenIndex = cookieArr.findIndex(el => el.includes('refreshToken'));
    const refresh_token = cookieArr[refreshTokenIndex + 1];
    if (!refresh_token) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refresh_token);

    const token = await generateToken(userId);
    await generateRefreshToken(userId, res)

    res.status(201);
    res.send({ access_token: token });
  } catch (error) {
    next(error); 
  }
})

router.post('/reset-password', async (req, res, next) => {
  try {
    const result = await loginSchema.validateAsync(req.body);
    const { email, password } = result;

    const userQuery = User.query();
    const userExists = await userQuery.findOne({ email });
    if(!userExists) throw createError.NotFound(`User is not registered`);

    const hashedPassword = await User.passwordHash(password);
    userQuery.findById(userExists.id).patch({ password: hashedPassword });

    const token = await generateToken(userExists.id);
    const newRefreshToken = await generateRefreshToken(userExists.id, res);

    res.status(201);
    return res.send({
        message: "Successfully updated password",
        access_token: token,
        refresh_token: newRefreshToken
      })  
  } catch (error) {
    next(error); 
  }
})

module.exports = router;
