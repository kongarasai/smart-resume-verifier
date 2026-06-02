# start with
ngrok http 5000
docker rm -f redis
docker run -d --name redis -p 6379:6379 redis
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
├── frontend/              Next.js 14 + Tailwind CSS
├── backend/               Node.js + Express + Socket.IO
├── python-ocr-service/    FastAPI + Tesseract OCR
└── db-schema/             PostgreSQL schema
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Zustand, Recharts, Socket.IO Client |
| Backend | Node.js, Express, JWT, bcryptjs, Socket.IO, pdf-parse |
| Database | PostgreSQL |
| OCR | Python, FastAPI, Tesseract, Pillow |
| Auth | JWT (RS256 ready), bcrypt (12 rounds) |
| Real-time | Socket.IO for live messaging |

---

## Prerequisites

- Node.js v18+
- PostgreSQL 14+
- Python 3.10+
- Tesseract OCR

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
# 1. Initialize Database
$env:PGPASSWORD='your_password'; createdb -U postgres smart_resume_verifier
psql -U postgres -d smart_resume_verifier -f db-schema/schema.sql

# 2. Start all services (separate terminals)
cd python-ocr-service && python main.py
cd backend && npm run dev
cd frontend && npm run dev
```

---

## Setup

### 1. Database

```bash
# Create database
createdb smart_resume_verifier

# Run schema
psql -d smart_resume_verifier -f db-schema/schema.sql
```

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values:
#   DATABASE_URL=postgresql://user:pass@localhost:5432/smart_resume_verifier
#   JWT_SECRET=your-secret-key-min-32-chars
#   GITHUB_TOKEN=ghp_your_personal_access_token

# Start development server
npm run dev
# API runs on http://10.68.139.201:5000
```

**Get a GitHub Token:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `public_repo`, `read:user`
4. Copy token to `.env`

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
# OCR service runs on http://10.68.139.201:8000
```

### 4. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://10.68.139.201:5000/api
#   NEXT_PUBLIC_SOCKET_URL=http://10.68.139.201:5000

# Start development server
npm run dev
# App runs on http://localhost:3000
```

---

## Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql://username:password@localhost:5432/smart_resume_verifier
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GITHUB_TOKEN=ghp_your_github_personal_access_token
OCR_SERVICE_URL=http://10.68.139.201:8000
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://10.68.139.201:5000/api
NEXT_PUBLIC_SOCKET_URL=http://10.68.139.201:5000
```

---

## User Roles

### Candidate
- Register and login
- Build profile (skills, projects, education, experience, certificates)
- Upload resume PDF → auto-parsed for skills
- Add GitHub URL → verified via GitHub REST API
- Upload LeetCode screenshot → OCR text extraction
- Manual LeetCode data entry
- Practice: Coding, Aptitude, Technical MCQ, HR questions
- View confidence score and skill evidence
- Message HR (only after interview scheduled)

### HR / Recruiter
- Register and login  
- Browse all candidates with scores and filters
- Search candidates by skills, experience, confidence score
- Requirement matching: input skills → ranked candidate list
- View full candidate detail: GitHub, LeetCode, practice, skills, education
- Generate interview questions based on candidate weak areas
- Schedule interviews (date, time, mode)
- Predict interview risk level (Low/Medium/High)
- Message candidates (only after interview scheduled)

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |

### Profile (Candidate)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get own profile |
| PUT | `/api/profile` | Update profile |
| POST | `/api/profile/resume` | Upload resume |
| POST | `/api/skills` | Add skill |
| POST | `/api/projects` | Add project |
| POST | `/api/education` | Add education |
| POST | `/api/experience` | Add experience |
| POST | `/api/certificates` | Add certificate |

### Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/github/verify` | Fetch & store GitHub data |
| GET | `/api/github/data` | Get GitHub stats |
| POST | `/api/leetcode/screenshot` | Upload & OCR screenshot |
| POST | `/api/leetcode/manual` | Manual LeetCode entry |
| POST | `/api/resume/parse` | Parse uploaded PDF |

### Practice
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions` | Get questions (filter: category, difficulty) |
| POST | `/api/practice/start` | Start session |
| POST | `/api/practice/submit` | Submit answer |
| POST | `/api/practice/end` | End session |
| GET | `/api/practice/progress` | My progress |

### Scoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/score/calculate` | Calculate confidence score |
| GET | `/api/score` | Get score |
| GET | `/api/score/:userId/risk` | Risk prediction |
| GET | `/api/suggestions/:candidateId` | Interview question suggestions |

### HR
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hr/candidates` | Search candidates |
| GET | `/api/hr/candidates/:id` | Full candidate detail |
| POST | `/api/hr/match` | Requirement matching |

### Interviews & Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews` | Schedule interview |
| GET | `/api/interviews` | My interviews |
| PATCH | `/api/interviews/:id` | Update status |
| POST | `/api/messages` | Send message |
| GET | `/api/messages/:userId` | Get conversation |
| GET | `/api/messages/conversations` | All conversations |

---

## Scoring Formula

### Confidence Score (0–100)

```
Overall = GitHub Score × 0.35
        + Coding Evidence × 0.30
        + Practice Score  × 0.20
        + Profile Complete× 0.15
```

### Labels
- **High Confidence** (70–100): Strong evidence across all dimensions
- **Medium Confidence** (40–69): Some evidence, some gaps
- **Limited Evidence** (0–39): Insufficient verification data

### Risk Prediction
- **Low Risk**: Overall ≥ 70, no major gaps
- **Medium Risk**: Overall 40–69 or 1–2 weak signals
- **High Risk**: Overall < 30 or multiple weak signals

---

## Database Schema (Key Tables)

```
users                  → Authentication, roles
profiles               → Candidate extended info
skills                 → Skills with source (github/resume/manual)
projects               → Portfolio projects
education              → Academic history
experience             → Work history
certificates           → Certifications
github_data            → Real-time GitHub API data
leetcode_data          → OCR-extracted LeetCode stats
questions              → Practice question bank
practice_attempts      → Per-question attempts
practice_sessions      → Grouped session results
confidence_scores      → Calculated scores + skill gaps
skill_evidence         → Per-skill evidence mapping
interviews             → Scheduled interviews
messages               → Real-time chat messages
notifications          → In-app notifications
resume_parse_results   → PDF parse output
```

---

## Security Features

- **JWT authentication** on all protected routes
- **bcrypt** password hashing (12 rounds)
- **Role-based access control** (candidate vs HR)
- **File validation**: type checking, size limits
- **Rate limiting**: 200 requests per 15 minutes
- **Helmet.js**: HTTP security headers
- **Input validation** on all endpoints
- **Messaging gate**: only after interview scheduled

---

## Production Deployment

### Docker (Recommended)

```bash
# Build and start all services
docker-compose up --build
```

### Manual

1. Set `NODE_ENV=production` in backend
2. Set up PostgreSQL with SSL
3. Use AWS S3 for file storage (configure `STORAGE_TYPE=s3`)
4. Run behind nginx reverse proxy
5. Use PM2 for Node.js process management:
   ```bash
   pm2 start src/index.js --name resume-verifier-api
   ```
6. Build Next.js:
   ```bash
   cd frontend && npm run build && npm start
   ```

---

## Adding More Questions

```sql
INSERT INTO questions (category, difficulty, title, description, question_type, options, correct_answer, tags)
VALUES (
  'technical_mcq',
  'medium',
  'Your Question Title',
  'Full question description here.',
  'mcq',
  '[{"id":"a","text":"Option A"},{"id":"b","text":"Option B"},{"id":"c","text":"Option C"},{"id":"d","text":"Option D"}]',
  'b',
  ARRAY['tag1', 'tag2']
);
```

---

## Known Limitations

1. **LeetCode API**: LeetCode has no public API. OCR from screenshots is used as a workaround. Manual entry is also available.
2. **GitHub Rate Limits**: Without a token, GitHub API allows 60 req/hr. With a token: 5,000 req/hr.
3. **Resume Parsing**: PDF text extraction works best with text-based PDFs. Scanned/image PDFs require additional OCR setup.

---

## License

MIT — Free to use, modify, and deploy.
