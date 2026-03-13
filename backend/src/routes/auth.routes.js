const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validate');

// Registration validation rules
const registerValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
body('phone').matches(/^[0-9]{10,12}$/).withMessage('Phone must be 10-12 digits'),
body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
body('role').isIn(['farmer', 'buyer', 'admin', 'transporter']).withMessage('Invalid role'),
  body('location').isObject().withMessage('Location is required'),
  body('location.lat').isNumeric(),
  body('location.lng').isNumeric(),
  body('address').optional()
];

// Login validation
const loginValidation = [
  body('phone').notEmpty().withMessage('Phone number required'),
  body('password').notEmpty().withMessage('Password required')
];

// Routes
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/verify-phone', authController.verifyPhone);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;