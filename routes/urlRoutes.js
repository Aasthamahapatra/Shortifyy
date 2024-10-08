const express = require('express');
const { shortenUrl, handleRedirect } = require('../controllers/urlController');
const { authenticateJWT } = require('../middleware/auth');
const router = express.Router();

router.post('/shorten', authenticateJWT, shortenUrl);  // No multer middleware needed
router.get('/:code', handleRedirect);

module.exports = router;
