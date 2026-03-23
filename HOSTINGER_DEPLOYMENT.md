#!/bin/bash

# Mindanao Research Map - Deployment Guide for Hostinger VPS

## Prerequisites
You need:
- Node.js 18+ installed on VPS
- MongoDB Atlas connection string
- Mapbox token
- SSH access to your VPS

## Step 1: Prepare Files

### Create production server structure:
```
/home/username/mindanao-research/
├── server/                    (backend files)
│   ├── index-simple.js
│   ├── models/
│   ├── package.json
│   ├── .env
│   └── node_modules/
├── dist/                     (frontend files - built React app)
└── start.sh                 (startup script)
```

## Step 2: Upload Files to VPS

Using SFTP or SCP:
```bash
# Upload backend
scp -r server/* user@hostinger_ip:/home/username/mindanao-research/server/

# Upload frontend (dist folder)
scp -r dist/* user@hostinger_ip:/home/username/mindanao-research/dist/
```

## Step 3: Configure Environment on VPS

SSH into your VPS:
```bash
ssh user@hostinger_ip
cd /home/username/mindanao-research/server
```

Create `.env` file:
```bash
nano .env
```

Add:
```
MONGODB_URI=mongodb+srv://marpy09:marpafamily1131@cluster0.cwd0mqp.mongodb.net/mindanao-research?retryWrites=true&w=majority
PORT=3001
NODE_ENV=production
```

Save with Ctrl+O, Enter, Ctrl+X

## Step 4: Install Dependencies

```bash
cd /home/username/mindanao-research/server
npm install --production
```

## Step 5: Start Server

### Option A: Manual Start
```bash
node index-simple.js
```

### Option B: Using PM2 (Recommended for production)
```bash
npm install -g pm2
pm2 start index-simple.js --name "mindanao-research"
pm2 startup
pm2 save
```

To check status:
```bash
pm2 status
pm2 logs
```

## Step 6: Setup Reverse Proxy (Nginx)

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/mindanao-research
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        # Serve frontend files
        root /home/username/mindanao-research/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        # Proxy backend requests
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/mindanao-research /etc/nginx/sites-enabled/
nginx -t
sudo systemctl restart nginx
```

## Step 7: Setup SSL Certificate (Free with Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 8: Update Frontend API Configuration

Before deploying, update your frontend API calls to use production URL:

In `src/services/api.ts` or similar:
```typescript
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api'
  : 'http://localhost:3001/api';
```

Then rebuild:
```bash
npm run build
```

## Troubleshooting

**502 Bad Gateway:** Backend not running
```bash
pm2 status
pm2 restart mindanao-research
```

**Cannot connect to MongoDB:** Check connection string and IP whitelist
```bash
pm2 logs mindanao-research
```

**Static files not loading:** Check Nginx root path and file permissions
```bash
ls -la /home/username/mindanao-research/dist
chmod 755 /home/username/mindanao-research/dist
```

**Check ports:**
```bash
sudo netstat -tuln | grep LISTEN
```

## Domain Configuration

Point your domain's DNS to Hostinger's nameservers or update A record to VPS IP.

Done! Your app is live! 🚀
