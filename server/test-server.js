require('./loadEnv');
console.log('✅ dotenv loaded');

const express = require('express');
console.log('✅ express loaded');

const app = express();
const PORT = 3001;

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK'});
});

console.log('🚀 Starting server...');
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
