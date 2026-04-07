const express = require('express');
const router = express.Router();
const { validateRegister, validateLogin } = require('../validators/auth.validator');
const { register, login } = require('../controllers/auth.controller');

// Register new user
router.post('/register', validateRegister, register);

// Login user
router.post('/login', validateLogin, login);

module.exports = router;
