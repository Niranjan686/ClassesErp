# CLASSTECH SCHOOL ERP SAAS — DEPLOYMENT & CONFIGURATION GUIDE

**System Architecture:** Multi-Tenant Node.js/Express API + Vite/React 18 Dashboard + React Native Expo  
**Target Environments:** Linux Ubuntu LTS / Docker / AWS ECS / Vercel Serverless / MongoDB Atlas

---

## 1. Environment Configuration

### 1.1 Backend Environment Variables (`server/.env`)

```ini
# Server Core
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://app.classtech.edu

# MongoDB Atlas Multi-Tenant Cluster
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ntj0r.mongodb.net/SchoolErp?retryWrites=true&w=majority&appName=SchoolErp

# Authentication & JWT
JWT_SECRET=super_secret_jwt_key_classtech_2026_enterprise
JWT_EXPIRATION=7d

# File Storage (AWS S3 or Local / S3-compatible MinIO)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-south-1
S3_BUCKET_NAME=classtech-production-vault

# Biometric & Hardware Ingestion
HARDWARE_SECRET_KEY=hardware_ingest_key_2026_rfid_zkteco
DEBOUNCE_MINUTES=5

# Payment Gateway (Optional / Sandbox)
RAZORPAY_KEY_ID=rzp_live_example123
RAZORPAY_KEY_SECRET=secret_example123
```

### 1.2 Frontend Environment Variables (`frontend/.env`)

```ini
VITE_API_URL=https://api.classtech.edu/api
VITE_SOCKET_URL=https://api.classtech.edu
VITE_APP_TITLE=ClassTech ERP
```

---

## 2. Production Deployment Options

### Option A: Linux VM (Ubuntu LTS) with PM2 & Nginx

```bash
# 1. Clone repository
git clone https://github.com/your-org/classtech-erp.git /var/www/classtech
cd /var/www/classtech

# 2. Build Frontend
cd frontend
npm ci
npm run build
# Built files will be in frontend/dist

# 3. Setup Backend
cd ../server
npm ci --production
pm2 start server.js --name "classtech-api" -i max
pm2 save
pm2 startup
```

#### Nginx Virtual Host Configuration (`/etc/nginx/sites-available/classtech.conf`):
```nginx
server {
    listen 80;
    server_name app.classtech.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.classtech.edu;

    ssl_certificate /etc/letsencrypt/live/app.classtech.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.classtech.edu/privkey.pem;

    # Frontend Single Page App (SPA)
    location / {
        root /var/www/classtech/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Gateway
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Real-Time Push
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Option B: Vercel Serverless Deployment

The project is structured with native Vercel Serverless compatibility:
- `server/server.js` exports `module.exports = app;`.
- DB connections are managed conditionally without hanging listener threads (`process.env.VERCEL` check).
- Connect GitHub repository directly to Vercel and configure root directory to `frontend` with rewrites pointing `/api/*` to serverless function endpoints.

---

## 3. Hardware Device Integration Protocol

ClassTech connects to physical campus RFID gates, fingerprint scanners, and facial recognition terminals (e.g. ZKTeco, eSSL, Realtime, Hikvision).

```mermaid
sequenceDiagram
    participant Student as Student / Staff
    participant Device as RFID / Biometric Gate
    participant LocalAgent as Local Edge Push Agent
    participant Cloud as ClassTech Cloud Gateway
    participant Mobile as Parent Mobile App (Socket)

    Student->>Device: Taps RFID card or Scans Face
    Device->>LocalAgent: TCP/IP Wiegand / ADMS Event
    LocalAgent->>Cloud: POST /api/attendance/device-event (x-device-key)
    Note over Cloud: Validates Tenant ID & Applies 5-Min Debounce
    Cloud->>Cloud: Auto-records Attendance (Status: Present, inTime)
    Cloud-->>LocalAgent: HTTP 200 { status: "Processed" }
    Cloud->>Mobile: WebSocket Push: "Student arrived at Campus Gate 1"
```

### Local Campus Edge Relay Script (`campus-relay.py`)
Install on an on-campus gateway or Raspberry Pi connected to local turnstiles:

```python
import requests
import time
import socket

CLOUD_INGEST_URL = "https://api.classtech.edu/api/attendance/device-event"
DEVICE_KEY = "hardware_ingest_key_2026_rfid_zkteco"
DEVICE_ID = "GATE-NORTH-01"

def push_punch_event(rfid_tag, direction="IN"):
    payload = {
        "deviceId": DEVICE_ID,
        "identifier": rfid_tag,
        "punchType": direction,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    headers = {
        "Content-Type": "application/json",
        "x-device-key": DEVICE_KEY
    }
    try:
        res = requests.post(CLOUD_INGEST_URL, json=payload, headers=headers, timeout=3)
        print(f"Pushed punch for {rfid_tag}: {res.status_code}")
    except Exception as e:
        print(f"Failed to push punch: {e}")
```

---

## 4. Database Backup & Disaster Recovery

### Automated Daily MongoDB Atlas Backup Script

Create a cron task running daily at midnight:

```bash
#!/bin/bash
# Backup Script: /opt/scripts/backup-mongodb.sh
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/mongodb"
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.ntj0r.mongodb.net/SchoolErp"

mkdir -p $BACKUP_DIR
mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_DIR/schoolerp_backup_$TIMESTAMP.gz"

# Retain last 14 days of backups
find $BACKUP_DIR -type f -mtime +14 -name "*.gz" -exec rm {} \;
```

---

## 5. Multi-Tenant Onboarding Runbook

To onboard a new school onto the ClassTech platform:
1. **Tenant Provisioning:**
   - Log into `/super-admin`.
   - Click **Add New Institute**.
   - Input: School Name, Tenant Code (`e.g. DPS01`), Principal Email, Mobile Number.
2. **Subscription Activation:**
   - Assign SaaS Plan (e.g. `Growth Plan` with 14-day trial).
3. **Academic Setup:**
   - Create Academic Year (`2026-2027`).
   - Define Courses/Standards (`Grade 1` through `Grade 12`).
   - Create Batch Sections (`A`, `B`, `C`).
4. **Student Data Ingestion:**
   - Download the Excel/CSV student template from `/students`.
   - Fill in student names, roll numbers, guardian phones.
   - Use the **Bulk Import** button with built-in formula sanitization.
5. **Staff & Operations Setup:**
   - Register faculty and generate timetables.
   - Configure transport routes and library books.
