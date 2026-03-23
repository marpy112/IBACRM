const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const rootEnvPath = path.join(__dirname, '../.env');
const serverEnvPath = path.join(__dirname, '.env');

const envPath = fs.existsSync(rootEnvPath) ? rootEnvPath : serverEnvPath;

dotenv.config({ path: envPath });

module.exports = { envPath };
