const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

// Validation rules
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('category').isIn(['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other']),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('unit').isIn(['kg', 'g', 'piece', 'bunch', 'crate', 'bag']),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('location').isObject().withMessage('Location is required'),
  body('location.lat').isNumeric(),
  body('location.lng').isNumeric()
];

// Routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', 
  protect, 
  authorize('farmer'), 
  productValidation, 
  validateRequest, 
  productController.createProduct
);
router.put('/:id', protect, authorize('farmer'), productController.updateProduct);
router.delete('/:id', protect, authorize('farmer'), productController.deleteProduct);

module.exports = router;