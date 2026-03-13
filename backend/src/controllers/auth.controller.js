const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sendSMS } = require('../utils/sms');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      phone: user.phone, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, phone, password, role, location, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { phone } });
if (existingUser) {
      // For existing users, send verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      existingUser.verificationCode = verificationCode;
      await existingUser.save();
      
      await sendSMS(phone, `Your Harvest Circle verification code is: ${verificationCode}`);
      
      const token = generateToken(existingUser);
      existingUser.password = undefined;
      
      return res.status(200).json({
        success: true,
        message: 'Verification code sent. Please verify your phone number.',
        data: {
          user: existingUser,
          token,
          verificationCode // dev only
        }
      });
    }

    // Create location point for PostGIS if provided
    let locationPoint = null;
    if (location && location.lat && location.lng) {
      locationPoint = {
        type: 'Point',
        coordinates: [location.lng, location.lat] // PostGIS uses (longitude, latitude)
      };
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      phone,
      password,
      role,
      location: locationPoint,
      address,
      verified: false
    });

    // Generate verification code (for SMS)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code in user record (you might want a separate table)
    user.verificationCode = verificationCode;
    await user.save();

    // Send verification SMS
    await sendSMS(phone, `Your Harvest Circle verification code is: ${verificationCode}`);

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your phone number.',
      data: {
        user,
        token,
        verificationCode // Send code in response for dev (remove in production)
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user by phone
    const user = await User.findOne({ 
      where: { phone }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Check password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your phone number first'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Verify phone number
exports.verifyPhone = async (req, res) => {
  try {
    const { phone, code } = req.body;

    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    user.verified = true;
    user.verificationCode = null;
    await user.save();

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset code via SMS
    await sendSMS(phone, `Your Harvest Circle password reset code is: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset code sent to your phone'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;

    const user = await User.findOne({ 
      where: { 
        phone,
        resetPasswordToken: code,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      } 
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

