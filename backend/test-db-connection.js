const sequelize = require('./src/config/database');

console.log('Testing PostgreSQL 18 connection...');
console.log('Host: localhost');
console.log('Port: 5432');
console.log('Database: harvestcircle');
console.log('User: postgres');
console.log('Password: ZLATAN');
console.log('');

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully to PostgreSQL 18');
    console.log('');
    console.log('Backend is working and database is connected!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
