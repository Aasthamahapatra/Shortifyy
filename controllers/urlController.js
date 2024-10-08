const pool = require('../config/db');
const geoip = require('geoip-lite');
const uaParser = require('ua-parser-js');
const jwt = require('jsonwebtoken');

// URL Shortening Logic
const createUniqueCode = () => {
    return Math.random().toString(36).substring(2, 8);
};

// Shorten URL Handler
const shortenUrl = async (req, res) => {
    const { long_url, name, expires, image_url } = req.body;  // Get image URL from request body
    const userId = req.user.id;

    if (!long_url) {
        return res.status(400).json({ message: 'Original URL is required' });
    }

    try {
        let code;
        let isUnique = false;

        while (!isUnique) {
            code = createUniqueCode();
            const checkQuery = 'SELECT * FROM urls WHERE code = $1';
            const existingUrl = await pool.query(checkQuery, [code]);
            if (existingUrl.rows.length === 0) {
                isUnique = true;
            }
        }

        const addUrlQuery = `
            INSERT INTO urls (long_url, code, name, image_url, created_on, expires_at, created_by)
            VALUES ($1, $2, $3, $4, DEFAULT, $5, $6)
            RETURNING *`;
        const newUrl = await pool.query(addUrlQuery, [long_url, code, name || null, image_url || null, expires || null, userId]);

        res.status(201).json({
            message: 'URL shortened',
            short_url: `http://localhost:3000/${code}`,
            url: newUrl.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Redirect to Original URL Handler
const handleRedirect = async (req, res) => {
    const { code } = req.params;

    try {
        const findUrlQuery = 'SELECT * FROM urls WHERE code = $1';
        const urlResult = await pool.query(findUrlQuery, [code]);

        if (urlResult.rows.length === 0) {
            return res.status(404).json({ message: 'URL not found' });
        }

        const url = urlResult.rows[0];
        if (url.expires_at && new Date(url.expires_at) < new Date()) {
            return res.status(410).json({ message: 'URL expired' });
        }

        res.redirect(url.long_url);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { shortenUrl, handleRedirect };
