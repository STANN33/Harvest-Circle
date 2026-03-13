const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.ENUM('kg', 'g', 'piece', 'bunch', 'crate', 'bag'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  harvestDate: {
    type: DataTypes.DATE
  },
  expiryDate: {
    type: DataTypes.DATE
  },
  location: {
    type: DataTypes.GEOMETRY('POINT')
  },
  status: {
    type: DataTypes.ENUM('available', 'sold', 'reserved'),
    defaultValue: 'available'
  }
});

module.exports = Product;