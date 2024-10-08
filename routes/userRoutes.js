const express = require('express');
const { register, signin, signout } = require('../controllers/userController');
const router = express.Router();

router.post('/register', register);
router.post('/login', signin);
router.post('/logout', signout);

module.exports = router;
