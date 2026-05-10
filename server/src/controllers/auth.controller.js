const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// ─── Helper — generate a signed JWT token ────────────────────────────────────
const signToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if email is already taken
    console.log('User----', User);
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 2. Create the user — beforeCreate hook hashes the password automatically
    const user = await User.create({
      name,
      email,
      password_hash: password, // Will be hashed by the hook
    });

    // 3. Sign a token so the user is immediately logged in after registering
    const token = signToken(user);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2. Check password
    const passwordValid = await user.comparePassword(password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Sign token
    const token = signToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
