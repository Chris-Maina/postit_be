const JWT = require('jsonwebtoken');
const createError = require('http-errors');

const generateToken = async userId => {
  const payload = { id: userId };
  const options = {
    expiresIn: '15m',
  }
  return new Promise((resolve, reject) => {
    JWT.sign(payload, process.env.JWT_SECRET, options, (err, token) => {
      if (err) return reject(createError.InternalServerError());
      resolve(token)
    })
  });
}

const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) return next(createError.Unauthorized())
  const authHeader = req.headers.authorization.split(' ');
  const token = authHeader[1];
  JWT.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      if (err.name === 'JsonWebTokenError') {
        return next(createError.Unauthorized());
      } else {
        return next(createError.Unauthorized(err.message));
      }
    }
    req.payload = payload;
    next()
  })
}

/**
 * Refresh token helps automatically login a user after token has expired.
 * Used to get a new acess token
*/
const generateRefreshToken = (userId, response) => {
  const payload = { id: userId };
  const options = {
    expiresIn: '30d',
  }
  return new Promise((resolve, reject) => {
    JWT.sign(payload, process.env.REFRESH_SECRET, options, (err, token) => {
      if (err) return reject(createError.InternalServerError());
      // Save token in cookie
      response.cookie("refreshToken", token, {
        expiresIn: '30d',
        httpOnly: true,
        secure: false,
        sameSite: 'Strict'
      });
      
      resolve(token);
    })
  });
}

const verifyRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    JWT.verify(refreshToken, process.env.REFRESH_SECRET, (err, payload) => {
      if (err) return reject(createError.BadRequest());
      resolve(payload.id);
    })
  })
}

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
};
