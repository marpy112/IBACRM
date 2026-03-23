# Hostinger VPS Deployment Checklist

## ✅ Pre-Deployment (Local Machine)

- [x] Frontend built: `npm run build` ✓
- [x] Backend ready: `server/production.js` ✓
- [x] MongoDB configured with IP whitelist ✓
- [ ] Update API URLs in frontend if needed
- [ ] Test locally: `npm run build && cd server && node production.js`

## 🚀 Deployment Steps

### 1. Upload to Hostinger VPS
```bash
# Connect to VPS
ssh user@your-vps-ip

# Create directories
mkdir -p /home/username/mindanao-research/server
mkdir -p /home/username/mindanao-research/dist
```

### 2. Upload Files (from your local machine)
```bash
# Upload backend files
scp -r server/*.js user@your-vps-ip:/home/username/mindanao-research/server/
scp -r server/models user@your-vps-ip:/home/username/mindanao-research/server/
scp -r server/package*.json user@your-vps-ip:/home/username/mindanao-research/server/
scp -r server/node_modules user@your-vps-ip:/home/username/mindanao-research/server/

# Upload frontend dist files
scp -r dist/* user@your-vps-ip:/home/username/mindanao-research/dist/
```

### 3. Setup Environment on VPS
```bash
cd /home/username/mindanao-research/server

# Create .env
echo 'MONGODB_URI=mongodb+srv://marpy09:marpafamily1131@cluster0.cwd0mqp.mongodb.net/mindanao-research?retryWrites=true&w=majority' > .env
echo 'PORT=3001' >> .env
echo 'NODE_ENV=production' >> .env

# Install dependencies
npm install --production
```

### 4. Start Server (Production)
```bash
# Option A: Direct start
cd /home/username/mindanao-research/server
node production.js

# Option B: Using PM2 (recommended for always-on)
npm install -g pm2
pm2 start production.js --name "mindanao-research"
pm2 startup
pm2 save
```

### 5. Setup Nginx Reverse Proxy
```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/mindanao-research
```

Paste this:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then:
```bash
sudo ln -s /etc/nginx/sites-available/mindanao-research /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate (Free - Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📋 File Checklist

**Backend files to upload:**
- ✅ `server/production.js` (main server)
- ✅ `server/models/Admin.js` (database model)
- ✅ `server/models/Location.js` (database model)
- ✅ `server/package.json` (dependencies)
- ✅ `server/node_modules/` (dependencies installed)

**Frontend files to upload:**
- ✅ `dist/` folder (React build output)

**Environment setup:**
- ✅ `.env` file (MongoDB URI, PORT)

---

## 🔍 After Deployment

### Test your app:
```bash
# SSH to VPS
curl http://localhost:3001/api/health

# Check PM2 status
pm2 status
pm2 logs mindanao-research

# Check Nginx
sudo nginx -t
```

### Common Issues:
| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Backend not running: `pm2 start production.js` |
| Cannot connect to DB | Check MongoDB Atlas IP whitelist |
| Static files 404 | Check nginx config and dist folder path |
| Port already in use | Change PORT in .env or kill process on that port |

---

## 📞 Support

For issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. SSH and manually run: `node production.js` (to see errors)

---

That's it! Your app is live! 🎉
