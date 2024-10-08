const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config(); // Load environment variables from .env
const JWT_SECRET = process.env.JWT_SECRET;

// Utility to generate JWT token
const createToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30m' });
};

// User Signup Handler
const register = async (req, res) => {
    const { email, password } = req.body;

    // Check password strength
    const strongPassword = /^(?=.*[a-zA-Z])(?=.*[0-9])[A-Za-z0-9]{8,}$/;
    if (!strongPassword.test(password)) {
        return res.status(400).json({ message: 'Password must be 8 characters long with numbers and letters.' });
    }

    try {
        const existingUserQuery = 'SELECT * FROM users WHERE email = $1';
        const existingUser = await pool.query(existingUserQuery, [email]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUserQuery = `
            INSERT INTO users (email, password, created_on)
            VALUES ($1, $2, DEFAULT)
            RETURNING *`;
        const user = await pool.query(newUserQuery, [email, hashedPassword]);

        res.status(201).json({ message: 'Registration successful', user: user.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// User Login Handler
const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const user = await pool.query(userQuery, [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = createToken(user.rows[0]);

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                email: user.rows[0].email,
                created_on: user.rows[0].created_on
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// User Logout Handler
const signout = (req, res) => {
    res.json({ message: 'Logout successful' });
};

module.exports = { register, signin, signout };
