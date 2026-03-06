# FieldOps

A comprehensive field service workforce management platform for technicians, dispatchers, and administrators.

![FieldOps](https://img.shields.io/badge/FieldOps-Platform-2563eb?style=for-the-badge)

## Features

- **Dashboard** - Overview with key metrics, weather widget, and upcoming tasks
- **Task Management** - Create, assign, and track tasks with calendar and list views
- **Map View** - Real-time GPS tracking of technicians and job locations
- **Inventory Management** - Track parts, equipment, and stock levels
- **Team Management** - Manage technicians, availability, and performance
- **Reports & Analytics** - Charts, metrics, and performance insights
- **Authentication** - JWT-based secure login and registration

## Tech Stack

- **Frontend:** React, Tailwind CSS, Shadcn/UI, Recharts, React-Leaflet
- **Backend:** FastAPI, Python
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or cloud)
- Yarn package manager

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/fieldops.git
cd fieldops
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# OR create manually:
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=fieldops
JWT_SECRET=your-secret-key-change-in-production
OPENWEATHER_API_KEY=your-openweather-api-key
EOF

# Run the backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Backend will be available at: `http://localhost:8001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Create environment file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Run the frontend
yarn start
```

Frontend will be available at: `http://localhost:3000`

---

## Deployment

### Option 1: Railway (Recommended - Easiest)

Railway provides free MongoDB and automatic deployments.

#### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `fieldops` repository

3. **Add MongoDB**
   - Click "New" → "Database" → "MongoDB"
   - Railway will create a MongoDB instance

4. **Configure Backend Service**
   - Click on your backend service
   - Go to "Settings" → "Environment"
   - Add variables:
     ```
     MONGO_URL=<Railway MongoDB URL>
     DB_NAME=fieldops
     JWT_SECRET=<generate-a-secure-key>
     ```
   - Set "Root Directory" to `/backend`
   - Set "Start Command" to `uvicorn server:app --host 0.0.0.0 --port $PORT`

5. **Configure Frontend Service**
   - Add another service from the same repo
   - Set "Root Directory" to `/frontend`
   - Add variable:
     ```
     REACT_APP_BACKEND_URL=<your-backend-railway-url>
     ```
   - Set "Build Command" to `yarn build`
   - Set "Start Command" to `npx serve -s build -l $PORT`

6. **Deploy!**
   - Railway auto-deploys on every git push

---

### Option 2: Render

#### Backend Deployment:

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   ```
   MONGO_URL=<your-mongodb-atlas-url>
   DB_NAME=fieldops
   JWT_SECRET=<your-secret>
   ```

#### Frontend Deployment:

1. New → Static Site
2. Connect same repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `yarn build`
   - **Publish Directory:** `build`
4. Add environment variable:
   ```
   REACT_APP_BACKEND_URL=<your-render-backend-url>
   ```

---

### Option 3: Vercel + MongoDB Atlas

Best for frontend performance with global CDN.

#### MongoDB Atlas Setup:

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/fieldops
   ```

#### Backend on Render/Railway:

Deploy backend using instructions above with Atlas MONGO_URL.

#### Frontend on Vercel:

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Create React App
4. Add environment variable:
   ```
   REACT_APP_BACKEND_URL=<your-backend-url>
   ```
5. Deploy!

---

### Option 4: DigitalOcean Droplet (Full Control)

For complete server control and customization.

#### 1. Create Droplet

- Choose Ubuntu 22.04
- Minimum: 1GB RAM, 1 vCPU ($6/month)

#### 2. SSH and Setup

```bash
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y python3-pip python3-venv nodejs npm nginx certbot

# Install yarn
npm install -g yarn

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod
```

#### 3. Clone and Setup App

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/fieldops.git
cd fieldops

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=fieldops
JWT_SECRET=$(openssl rand -hex 32)
EOF

# Frontend
cd ../frontend
yarn install
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env
yarn build
```

#### 4. Setup Systemd Service (Backend)

```bash
cat > /etc/systemd/system/fieldops-backend.service << EOF
[Unit]
Description=FieldOps Backend
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/fieldops/backend
Environment="PATH=/var/www/fieldops/backend/venv/bin"
ExecStart=/var/www/fieldops/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start fieldops-backend
systemctl enable fieldops-backend
```

#### 5. Setup Nginx

```bash
cat > /etc/nginx/sites-available/fieldops << EOF
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/fieldops/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/fieldops /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

#### 6. Setup SSL (Optional but Recommended)

```bash
certbot --nginx -d yourdomain.com
```

---

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URL` | MongoDB connection string | Yes |
| `DB_NAME` | Database name | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | No |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | No |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | No |
| `SENDGRID_API_KEY` | SendGrid API key | No |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_BACKEND_URL` | Backend API URL | Yes |

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Inventory
- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Add item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### Team
- `GET /api/team` - List team members
- `PUT /api/team/:id` - Update member
- `PUT /api/team/:id/location` - Update location

### Analytics
- `GET /api/analytics/overview` - Dashboard stats
- `GET /api/analytics/performance` - Performance data

### Weather
- `GET /api/weather?lat=&lon=` - Get weather data

---

## Optional Integrations

### Weather API (OpenWeatherMap)
1. Get API key from [openweathermap.org](https://openweathermap.org/api)
2. Add to backend `.env`:
   ```
   OPENWEATHER_API_KEY=your-api-key
   ```

### SMS Notifications (Twilio)
1. Get credentials from [twilio.com](https://twilio.com)
2. Add to backend `.env`:
   ```
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_PHONE_NUMBER=your-number
   ```

### Email Notifications (SendGrid)
1. Get API key from [sendgrid.com](https://sendgrid.com)
2. Add to backend `.env`:
   ```
   SENDGRID_API_KEY=your-api-key
   SENDER_EMAIL=your-verified-email
   ```

---

## License

This project is proprietary. All rights reserved.

---

## Support

For issues or questions, please open a GitHub issue.
