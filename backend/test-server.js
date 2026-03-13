const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Harvest Circle API is running!' });
});

app.listen(5000, () => {
  console.log('✅ Test server running on port 5000');
});