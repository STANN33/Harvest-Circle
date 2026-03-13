const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configure for PostgreSQL 18 with password ZLATAN
const sequelize = new Sequelize(
  'harvestcircle',
  'postgres',
  'ZLATAN',
  {
    host: 'localhost',
    port: 5433,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

module.exports = sequelize;
