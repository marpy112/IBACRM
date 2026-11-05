const express = require('express');
const fs = require('fs');
const path = require('path');
const app = require('./index');

const distDir = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => res.sendFile(indexHtmlPath));
}

const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log('Backend server running on port ' + port);
});
