# MongoDB Setup Guide for Mindanao Research Map

## Quick Start with MongoDB Atlas (Free)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Register" and create your account
3. Verify your email

### Step 2: Create a Cluster
1. Click "Create" project
2. Click "Build a Database"
3. Choose the **FREE** tier (M0)
4. Select a region (AWS US East recommended for low latency)
5. Click "Create Cluster" (takes 1-3 minutes)

### Step 3: Set Up Security
1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Create a username and password (remember these!)
4. Click "Add User"

### Step 4: Get Connection String
1. In the left sidebar, click "Database"
2. Click "Connect" on your cluster
3. Choose "Drivers" > "Node.js"
4. Copy the connection string

### Step 5: Configure .env
Replace in the root `.env`:
```
MONGODB_URI=mongodb+srv://yourUsername:yourPassword@clustername.mongodb.net/mindanao-research?retryWrites=true&w=majority
```

### Step 6: Install Dependencies
```bash
cd server
npm install
```

### Step 7: Start the Server
```bash
npm start        # Production
# or
npm run dev      # Development with auto-reload
```

## Local MongoDB Alternative

If you prefer local MongoDB:

### Windows
1. Download from https://www.mongodb.com/try/download/community
2. Run installer and follow prompts
3. Add MongoDB to PATH
4. Use connection string: `mongodb://localhost:27017/mindanao-research`

### Requirements Met
- ✅ Admin authentication with MongoDB
- ✅ Location data with persistence
- ✅ Automatic schema validation
- ✅ Full CRUD operations
- ✅ Data migration from JSON (existing locations preserved)

## Troubleshooting

**"MONGODB_URI not defined"**
→ Create the root `.env` file with your connection string

**"Connection timeout"**
→ Check your MongoDB Atlas IP whitelist (add 0.0.0.0/0 for development)

**"Authentication failed"**
→ Verify username/password and that user exists in Database Access

**Need help?**
→ Check server logs for detailed error messages
