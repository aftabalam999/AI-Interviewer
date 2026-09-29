const { validationResult } = require('express-validator');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');
const { generateAccessToken, generateRefreshToken, sendTokenResponse } = require('../utils/jwt.utils');

const ADMIN_EMAIL = 'aftab@admin.com';

const getGoogleRedirectUri = () => process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

exports.googleAuth = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ success: false, message: 'Google sign-in is not configured.' });
  }

  const state = crypto.randomBytes(24).toString('hex');
  res.setHeader('Set-Cookie', `google_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

exports.googleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const [key, ...value] = part.trim().split('=');
    return [key, value.join('=')];
  }));

  if (req.query.error || !req.query.code || !req.query.state || req.query.state !== cookies.google_oauth_state) {
    return res.redirect(`${clientUrl}/register?googleError=cancelled`);
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      code: req.query.code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: 'authorization_code',
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });
    const profile = profileResponse.data;

    if (!profile.email || profile.email_verified === false) {
      return res.redirect(`${clientUrl}/register?googleError=unverified`);
    }

    let user = await User.findOne({ email: profile.email });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        password: crypto.randomBytes(32).toString('hex'),
        avatar: profile.picture || null,
      });
    }

    if (!user.isActive || user.isBanned) {
      return res.redirect(`${clientUrl}/register?googleError=inactive`);
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    return res.redirect(`${clientUrl}/auth/callback#accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`);
  } catch (error) {
    console.error('Google OAuth failed:', error.response?.data || error.message);
    return res.redirect(`${clientUrl}/register?googleError=failed`);
  }
};

// ─── POST /api/auth/register ───────────────────────────────────────
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  // Assign super_admin role automatically for the designated admin email
  const role = email.toLowerCase() === ADMIN_EMAIL ? 'super_admin' : 'candidate';
  const user = await User.create({ name, email, password, role });
  sendTokenResponse(user, 201, res);
};

// ─── POST /api/auth/login ─────────────────────────────────────────
exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated.', 403));
  }

  if (user.isBanned) {
    return next(new AppError('Your account has been banned due to violation of terms.', 403));
  }

  // Ensure admin email always has super_admin role (self-healing)
  if (email.toLowerCase() === ADMIN_EMAIL && user.role !== 'super_admin') {
    user.role = 'super_admin';
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
};

// ─── POST /api/auth/refresh ────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required.', 400));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('User no longer exists.', 401));

    const { generateAccessToken } = require('../utils/jwt.utils');
    const accessToken = generateAccessToken(user._id);

    res.status(200).json({ success: true, accessToken });
  } catch {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
};

// ─── POST /api/auth/logout ────────────────────────────────────────
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
