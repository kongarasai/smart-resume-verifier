# Smart Resume Verifier - Technical Architecture

## 🚀 Overview
The Smart Resume Verifier is an industry-level platform designed to eliminate resume fraud and verify technical skills using a multi-layered AI and data-driven approach.

## 🏗️ Core Architecture

### 1. Verification Pipeline (The "Trust Engine")
*   **Resume OCR & AI Analysis**: Uses specialized AI models to extract skills and detect exaggerations.
*   **GitHub Deep Verification**: Analyzes repository originality (cloned vs. original), commit frequency, and language proficiency.
*   **LeetCode Integration**: Validates technical problem-solving counts and global rankings.
*   **Peer/Mentor Verification**: A manual verification layer for soft skills and project contributions.

### 2. Candidate Intelligence
*   **Trust Index (USP)**: A weighted algorithm (0-100) aggregating GitHub activity, skill verification, mock interviews, and resume quality.
*   **Fraud Detection**: Real-time risk assessment flagging suspicious patterns in external profiles.
*   **AI Mock Interviews**: Immersive, role-specific video-simulated interviews with question-by-question AI feedback.

### 3. Production Infrastructure
*   **Asynchronous AI Queue**: Uses **BullMQ + Redis** to handle heavy AI tasks in the background, ensuring high availability.
*   **Monitoring & Observability**: Integrated **Prometheus** metrics endpoint for tracking API latency, container health, and AI success rates.
*   **Security Layer**: Hardened with Helmet, CSRF protection, rate limiting, and secure cookie handling.
*   **Automated Backups**: Daily PostgreSQL snapshots with a 30-day retention policy.

### 4. HR Analytics Dashboard
*   **Hiring Funnel**: Real-time tracking of candidate status (Shortlist, Rejected, Hold).
*   **Talent Trends**: Visual distribution of skills and candidate quality across the platform.
*   **Risk Metrics**: Fraud risk distribution across the talent pool.

## 🛠️ Technology Stack
*   **Frontend**: Next.js (React), TailwindCSS, Recharts, Lucide Icons.
*   **Backend**: Node.js, Express, BullMQ, Redis, PostgreSQL.
*   **AI Layer**: Gemini / Groq / OpenRouter.
*   **Infrastructure**: Docker, Nginx, Prometheus.

---
*Generated for Professional Portfolio & Recruitment Documentation.*
