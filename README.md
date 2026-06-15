# start with
ngrok http 5000
docker rm -f redis
docker run -d --name redis -p 6379:6379 redis
npm run build && npx cap sync android && npx cap open android

git add .
git commit -m "message"
git push

# Smart Resume Truth Verifier

A **production-ready** full-stack platform for evidence-based resume verification. Verifies candidates using real GitHub API data, OCR-extracted LeetCode stats, and actual practice performance — not just self-reported claims.

---

## Architecture

```
smart-resume-verifier/
├── frontend/              Next.js 14 + Tailwind CSS + Capacitor (Mobile)
├── backend/               Node.js + Express + Socket.IO + Firebase Admin
├── python-ocr-service/    FastAPI + Tesseract OCR
└── qa-testing/            E2E Selenium Testing Suite
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Zustand, Recharts, Socket.IO Client |
| Mobile | Capacitor (Android/iOS) |
| Backend | Node.js, Express, JWT, bcryptjs, Socket.IO, pdf-parse, BullMQ, Redis |
| Database | Firebase Firestore (NoSQL) |
| OCR | Python, FastAPI, Tesseract, Pillow |
| AI | Google Gemini / Groq / OpenRouter |
| Auth | JWT (RS256 ready), bcrypt (12 rounds), Firebase Auth |
| Real-time | Socket.IO for live messaging |
| Deployment | Vercel (Frontend), Render (Backend) |

---

## Prerequisites

- Node.js v18+
- Python 3.10+
- Tesseract OCR
- Firebase Project with Firestore enabled
- Redis (for BullMQ)

### Install Tesseract

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

**Windows:**
Download installer from https://github.com/UB-Mannheim/tesseract/wiki

---

## Quick Start (Automated)

If you have all prerequisites installed, you can initialize and run all services with:

```bash
# 1. Start Redis for background queues
docker run -d --name redis -p 6379:6379 redis

# 2. Start all services (separate terminals)
cd python-ocr-service && python main.py
cd backend && npm run dev
cd frontend && npm run dev
```

---

## Setup

### 1. Database (Firebase)

Ensure you have a Firebase project created. You will need the service account credentials JSON to connect from the backend, and the client config for the frontend if using Firebase Auth on the client side.

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values:
#   FIREBASE_SERVICE_ACCOUNT_KEY='{...}'
#   JWT_SECRET=your-secret-key-min-32-chars
#   GITHUB_TOKEN=ghp_your_personal_access_token
#   REDIS_URL=redis://localhost:6379

# Start development server
npm run dev
# API runs on http://localhost:5000
```

### 3. Python OCR Service

```bash
cd python-ocr-service

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start service
python main.py
# OCR service runs on http://localhost:8000
```

### 4. Frontend & Mobile Apps

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:5000/api
#   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Start web development server
npm run dev
# App runs on http://localhost:3000

# Build and sync for Mobile (Android)
npm run mobile:build
npm run mobile:open-android
```

---

## Environment Variables

### Backend `.env`

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type": "service_account", ...}
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GITHUB_TOKEN=ghp_your_github_personal_access_token
OCR_SERVICE_URL=http://localhost:8000
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## QA Testing (Selenium E2E)

The project includes an end-to-end testing suite generating over 100+ functional and UI/UX test cases using Selenium WebDriver and Mocha/Chai.

```bash
cd qa-testing
npm install
node test_runner.js
```
This will run the test suite and automatically generate an Excel `.xlsx` E2E Test Report in the `qa-testing` directory.

---

## Production Deployment

### Docker

```bash
# Build and start services using Docker Compose
docker-compose up --build
```

### Manual

1. Set `NODE_ENV=production` in backend
2. Configure Firebase production project
3. Use AWS S3 for file storage (configure `STORAGE_TYPE=s3`)
4. Deploy the backend to a provider like Render.
5. Deploy the Next.js frontend to Vercel.

---

## License

MIT — Free to use, modify, and deploy.
