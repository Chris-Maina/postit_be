const router = require('express').Router();

router.use('/auth', require('./Auth.routes'));
router.use('/posts', require('./Post.routes'));
router.use('/vote', require('./Vote.routes'));
router.use('/comments', require('./Comment.routes'));

module.exports = router;
