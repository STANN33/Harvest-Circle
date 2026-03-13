const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const Review = require('./Review'); // We'll create this next

// User-Product relationships
User.hasMany(Product, { as: 'products', foreignKey: 'farmerId' });
Product.belongsTo(User, { as: 'farmer', foreignKey: 'farmerId' });

// User-Order relationships
User.hasMany(Order, { as: 'buyerOrders', foreignKey: 'buyerId' });
User.hasMany(Order, { as: 'sellerOrders', foreignKey: 'sellerId' });
Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
Order.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });

// Product-Order relationships
Order.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Order, { foreignKey: 'productId' });

// Review relationships
User.hasMany(Review, { as: 'reviewsGiven', foreignKey: 'reviewerId' });
User.hasMany(Review, { as: 'reviewsReceived', foreignKey: 'revieweeId' });
Order.hasOne(Review, { foreignKey: 'orderId' });
Review.belongsTo(Order, { foreignKey: 'orderId' });
Review.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewerId' });
Review.belongsTo(User, { as: 'reviewee', foreignKey: 'revieweeId' });

module.exports = {
  User,
  Product,
  Order,
  Review
};