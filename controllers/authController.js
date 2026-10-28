const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Generate signed JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register a new user and seed personalized starter goals
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const errors = [];

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
      errors.push('Full Name is required and must be between 2 and 50 characters.');
    }

    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
      errors.push('Username is required and must be between 3 and 30 characters.');
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push('Password must be at least 6 characters long.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    if (existingUser) {
      const field = existingUser.email === cleanEmail ? 'Email' : 'Username';
      return res.status(400).json({
        success: false,
        message: `${field} is already registered. Please choose another or sign in.`
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password
    });

    // Generate JWT token (New account starts 100% blank with 0 goals)
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Please sign in with your credentials.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating account',
      error: error.message
    });
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password.'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Find user by either email OR username
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while signing in',
      error: error.message
    });
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
