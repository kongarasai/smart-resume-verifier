# Smart Resume Verifier — System Architecture & Technical Specifications

> **Comprehensive Technical Architecture, Algorithms, Data Pipelines, and System Design Documentation.**

---

## 📑 Table of Contents
1. [Executive Overview & Core Mission](#1-executive-overview--core-mission)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Resume Parsing, OCR & Text Extraction Pipeline](#4-resume-parsing-ocr--text-extraction-pipeline)
5. [Multi-Source Skill Verification Engine ("Truth Engine")](#5-multi-source-skill-verification-engine-truth-engine)
6. [External Platform Verifiers](#6-external-platform-verifiers)
   - [6.1 GitHub Deep Authenticity Engine](#61-github-deep-authenticity-engine)
   - [6.2 LeetCode Verification Engine](#62-leetcode-verification-engine)
7. [The 5-Pillar Trust Scoring & AI Fraud Detection Algorithm](#7-the-5-pillar-trust-scoring--ai-fraud-detection-algorithm)
8. [Job Aggregation & Smart Candidate Matching Engine](#8-job-aggregation--smart-candidate-matching-engine)
9. [Leaderboard, Group Rankings & Career Readiness Engine](#9-leaderboard-group-rankings--career-readiness-engine)
10. [AI Mock Interview & Evaluation Engine](#10-ai-mock-interview--evaluation-engine)
11. [Role-Based Access Control (RBAC) & Security Layer](#11-role-based-access-control-rbac--security-layer)

---

## 1. Executive Overview & Core Mission

The **Smart Resume Verifier** is a full-stack, enterprise-grade talent verification platform. Traditional hiring processes suffer from significant resume fraud (inflated skill claims, plagiarized projects, fake certificates, and unverified credentials).

### The Solution:
Instead of taking resume text at face value, this platform operates as an **Evidence-Based Verification Engine**:
* It extracts claims from candidate resumes.
* It cross-verifies each claimed skill against live **GitHub code repositories**, **LeetCode algorithmic problem-solving records**, **platform coding practice tests**, and **project portfolio links**.
* It calculates a unified **5-Pillar Truth Score (0–100)** with real-time **AI Fraud Detection**.
* It indexes real-world remote job opportunities across multiple APIs and calculates real-time **Skill Match & Gap Analysis** for candidates.

---

## 2. Technology Stack

### 🖥️ Web Frontend
* **Framework**: Next.js 14 (React 18, App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS, Vanilla CSS Modules
* **State & Icons**: Lucide React, Recharts (for analytics & radar charts)
* **Networking**: Axios, Socket.IO Client

### 📱 Mobile Application
* **Framework**: React Native with Expo SDK 54
* **Navigation**: React Navigation (Bottom Tabs, Drawers, Native Stacks)
* **Language**: TypeScript / TSX
* **Storage & Icons**: `@react-native-async-storage/async-storage`, `@expo/vector-icons`

### ⚙️ Backend Core
* **Runtime**: Node.js (v18+) with Express.js
* **Asynchronous Queue**: BullMQ + Redis *(with a graceful synchronous Mock-Mode fallback when Redis is absent)*
* **Real-time WebSockets**: Socket.IO (bi-directional notifications and live interview streaming)
* **Security**: Helmet, CSRF Protection (`x-csrf-token`), Express-Rate-Limit, Cookie-Parser

### 🗄️ Database & Storage
* **Primary Database**: Google Cloud Firebase Firestore (NoSQL, collection/subcollection schema)
* **Authentication**: Firebase Authentication + Custom JWT Token Management
* **File Storage**: Local Authenticated Storage (`/uploads/resumes`, `/uploads/photos`, `/uploads/attachments`) with sanitized path-traversal prevention

### 🤖 AI & NLP Layer
* **Ollama (Self-Hosted)**: Llama 3 / DeepSeek / Mistral running on dedicated HuggingFace Space with automated keep-alive polling.
* **Groq Cloud API**: Ultra-fast fallback for Llama 3 70B inference.
* **In-Browser WebLLM**: Client-side LLM inference for offline/zero-latency candidate interview guidance.
* **Static Question Bank**: Guaranteed zero-downtime offline fallback containing 500+ curated technical questions.

---

## 3. System Architecture & Data Flow

```
                      ┌─────────────────────────────────┐
                      │  Next.js Web / Expo Mobile App  │
                      └────────────────┬────────────────┘
                                       │ HTTPS / WSS
                                       ▼
                      ┌─────────────────────────────────┐
                      │      Node.js Express Backend     │
                      │  (Helmet, CSRF, Rate Limiting)  │
                      └───────┬──────────────┬──────────┘
                              │              │
        ┌─────────────────────┼──────────────┼─────────────────────┐
        ▼                     ▼              ▼                     ▼
┌──────────────┐     ┌────────────────┐ ┌─────────────┐   ┌────────────────┐
│ Resume Parser│     │ GitHub/LeetCode│ │Trust Engine │   │ Job Aggregator │
│ (pdf-parse)  │     │  Live Scrapers │ │ & Fraud AI  │   │  (6 Job APIs)  │
└───────┬──────┘     └────────┬───────┘ └──────┬──────┘   └────────┬───────┘
        │                     │                │                   │
        └─────────────────────┼────────────────┴───────────────────┘
                              ▼
                 ┌───────────────────────────┐
                 │ Google Firebase Firestore │
                 │ (Skills, Scores, Rankings)│
                 └───────────────────────────┘
```

---

## 4. Resume Parsing, OCR & Text Extraction Pipeline

* **Source File:** `backend/src/services/resumeParser.js`

### 4.1 How Resume Upload Works
1. When a candidate uploads a resume (PDF), the file is processed via `multer` and saved into `backend/uploads/resumes/` under a sanitized filename format: `{userId}-{timestamp}-{random}.pdf`.
2. Access to this directory is strictly authenticated—users cannot read other candidates' resumes directly through static URLs.

### 4.2 Text Extraction Architecture
* **Engine**: `pdf-parse` (binary stream parsing).
* **Process**: Reads the binary stream of the PDF file and converts all text layers into raw UTF-8 string data:
  ```javascript
  // backend/src/services/resumeParser.js
  const extractTextFromPDF = async (filePath) => {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  };
  ```
* **Validation & OCR Fallback Protection**:
  If the extracted text has fewer than 50 characters, the file is identified as a scanned bitmap/image PDF. The system halts and requests a text-based digital PDF (e.g. generated from Word, LaTeX, or Google Docs) to prevent corrupted hallucinated skill extraction.

### 4.3 Skill Keyword Tokenization & NLP Dictionary
The parser compares the raw resume text against a curated dictionary of 70+ technology keywords (`SKILLS_DICT`):
```javascript
const extractSkills = (text) => {
  const lower = text.toLowerCase();
  const found = SKILLS_DICT.filter(skill => {
    if (skill.length <= 3) {
      return new RegExp(`\\b${skill.replace(/[+#]/g, '\\$&')}\\b`, 'i').test(lower);
    }
    return lower.includes(skill);
  });
  return [...new Set(found)];
};
```
* **Boundary Rules**: For short acronyms (e.g., `C`, `C++`, `Go`, `SQL`, `AWS`, `Git`), strict word boundary regex (`\b`) is enforced so that words like "good" or "categorize" do not accidentally trigger false matches.

### 4.4 Automated Section & URL Extraction
* **Section State Machine**: Analyzes headings (`Education`, `Experience`, `Projects`, `Work History`) and chunks text into structured blocks.
* **Regex URL Extractor**: Detects candidate links:
  - GitHub: `github.com/{username}`
  - LinkedIn: `linkedin.com/in/{username}`
  - LeetCode: `leetcode.com/u/{username}`
  - Portfolio/Project URLs: Automatically saved into the candidate's `projects` subcollection.

---

## 5. Multi-Source Skill Verification Engine ("Truth Engine")

* **Source File:** `backend/src/services/skillVerificationEngine.js`

A skill written in a resume is only a **claim**. The Truth Engine queries **5 independent evidence sources** to verify each skill:

```
                  ┌──────────────────────┐
                  │ Claimed Skill: React │
                  └──────────┬───────────┘
                             │
       ┌──────────────┬──────┴───────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼              ▼
 1. Resume Doc   2. GitHub Repos 3. LeetCode    4. Practice    5. Project
 (Mentioned)    (Uses JS/TS)    (Solved in JS) (Quiz Passed)  (Live App)
```

### Verification Tiers (`deriveLevel`):

| Level | Condition | Points Awarded |
| :--- | :--- | :---: |
| **`claimed`** | Self-claimed on profile or resume only (1 source) | **10 pts** |
| **`evidence`** | Supported by at least 2 sources (e.g. Resume + GitHub, or LeetCode + Projects) | **20 pts** |
| **`verified`** | Supported by $\ge 3$ sources OR confirmed via Resume + passed Practice Test | **40 pts** |
| **`strong_verified`** | Corroborated across **ALL 5 sources** simultaneously | **50 pts** |

---

## 6. External Platform Verifiers

---

### 6.1 GitHub Deep Authenticity Engine

* **Source File:** `backend/src/services/githubService.js` (Lines 112–122)

The GitHub engine connects directly to the GitHub REST API (`https://api.github.com/users/{username}`) and evaluates **authenticity over volume**.

```javascript
const calcGitHubScoreEnhanced = ({ originalRepos, stars, commits, pushEnvCnt, languages, followers, ageYears }) => {
   let s = 0;
   s += Math.min(originalRepos * 3, 30);                  // Original non-forked repos (Max 30 pts)
   s += Math.min(stars * 2, 20);                          // Stargazers count (Max 20 pts)
   s += Math.min((commits * 1.5) + (pushEnvCnt * 2), 25); // Recent commits & push events (Max 25 pts)
   s += Math.min(Object.keys(languages).length * 3, 10);  // Language diversity (Max 10 pts)
   s += Math.min(Math.floor(ageYears) * 2, 10);           // Account age (Max 10 pts)
   s += Math.min(followers, 5);                           // Followers (Max 5 pts)
   return Math.min(Math.round(s), 100);
};
```

#### Key Authenticity Checks:
1. **Fork Exclusion**: `if (repo.fork) continue;` — Prevents candidates from inflating their repo count by clicking "Fork" on popular open-source repositories.
2. **Push Event Frequency**: Inspects recent `/events` to verify active coding habits vs. inactive legacy profiles.
3. **Language Fingerprinting**: Extracts language usage percentages and feeds them back into the Skill Verification Engine.

---

### 6.2 LeetCode Verification Engine

* **Source File:** `backend/src/services/leetcodeService.js` (Lines 132–143)

Queries LeetCode's official GraphQL schema for problem breakdown, acceptance rates, and contest ratings.

```javascript
const calcCodingScore = (d) => {
  let s = 0;
  s += Math.min((d.total_solved || 0) * 0.15, 20);      // Total solved (Max 20 pts)
  s += Math.min((d.medium_solved || 0) * 0.25, 30);     // Medium problems (Max 30 pts)
  s += Math.min((d.hard_solved || 0) * 0.5, 25);        // Hard problems (Max 25 pts)
  if (d.contest_rating > 1800) s += 15;                 // Contest performance tier
  else if (d.contest_rating > 1500) s += 10;
  else if (d.contest_rating > 1200) s += 5;
  if (d.ranking && d.ranking < 10000) s += 5;
  return Math.min(Math.round(s), 100);
};
```

#### Key Features:
* **Difficulty Scaling**: Hard problems are rewarded $2\times$ higher than Medium problems and $3.3\times$ higher than Easy problems.
* **Contest Validation**: Rewards live competitive programming ratings (>1500 rating grants +10 pts).

---

## 7. The 5-Pillar Trust Scoring & AI Fraud Detection Algorithm

* **Source File:** `backend/src/services/scoringService.js` (Lines 95–190)

### 7.1 The Unified 5-Pillar Trust Score

$$\text{Final Score} = (\text{Coding} \times 0.20) + (\text{LeetCode} \times 0.25) + (\text{GitHub} \times 0.20) + (\text{Skills} \times 0.20) + (\text{Projects} \times 0.15)$$

```javascript
// File: backend/src/services/scoringService.js (Lines 137-140)
const overall = (testScore * 0.20) + (leetcodeScore * 0.25) + (githubScore * 0.20) + (skillScore * 0.20) + (projectCertScore * 0.15);
const finalScore = Math.round(overall);
```

### 7.2 Confidence Levels
* **High Confidence ($\ge 80$)**: Candidate has verified proof across all 5 dimensions.
* **Medium Confidence ($60 - 79$)**: Candidate has good evidence in multiple areas with minor gaps.
* **Limited Evidence ($< 60$)**: Candidate has missing or unlinked external profiles.

### 7.3 AI Fraud Risk Probability (`getFraudProbability`)
The system detects statistical anomalies in candidate profiles:
* **High Skill Claim vs. No GitHub**: Claims $>90\%$ skills but has $<10\%$ GitHub activity $\rightarrow +30\%$ Fraud Risk.
* **High Test Score vs. Zero GitHub**: Test score $>80\%$ but GitHub $<20\%$ $\rightarrow +25\%$ Fraud Risk.
* **Skill Claim vs. Test Failure**: Claims $>80\%$ skills but scored $<30\%$ on tests $\rightarrow +35\%$ Fraud Risk.
* **Corroborated Balance**: Strong GitHub ($>70\%$) AND strong test score ($>70\%$) reduces fraud risk to baseline ($5\% - 15\%$).

---

## 8. Job Aggregation & Smart Candidate Matching Engine

* **Source File:** `backend/src/services/jobService.js`

### 8.1 Multi-Platform Real-Time Aggregator
The platform automatically aggregates remote software engineering jobs across **6 international job APIs**:
1. **Remotive API** (`https://remotive.com/api/remote-jobs`)
2. **Jobicy API** (`https://jobicy.com/api/v2/remote-jobs`)
3. **Arbeitnow API** (`https://www.arbeitnow.com/api/job-board-api`)
4. **FindWork API** (`https://findwork.dev/api/jobs/`)
5. **Himalayas API** (`https://himalayas.app/jobs/api`)
6. **Wellfound API** (GraphQL Startup Listings)

* **Caching & Auto-Refresh**: Listings are saved to Firestore (`job_listings`). If the last fetch is older than **6 hours**, a background thread fetches fresh listings automatically.

### 8.2 Candidate Job Visibility & Matching Algorithm
Candidates view jobs via the Web portal (`/candidate/jobs`) and Mobile app (`JobsScreen.tsx`):

```javascript
// File: backend/src/services/jobService.js (Lines 166-181)
const calcMatch = async (userId, requiredSkills) => {
  const skillsSnap = await db.collection('users').doc(userId).collection('skills').get();
  const userSet = new Set(skillsSnap.docs.map(doc => normalise(doc.data().name)));

  const matched = requiredSkills.filter(s => userSet.has(normalise(s)));
  const missing = requiredSkills.filter(s => !userSet.has(normalise(s)));

  return {
    match_pct: Math.round((matched.length / requiredSkills.length) * 100),
    matched,
    missing: missing.map((skill, i) => ({ 
      skill, 
      priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low' 
    })),
  };
};
```

#### How Candidates Experience Jobs:
1. **"All Jobs" Tab**: Browse all indexed remote opportunities with real-time keyword search and pagination.
2. **"Matched Jobs" Tab**: Filters jobs to show **only** listings where the candidate's verified skills match the job requirements.
3. **Skill Gap Breakdown**: For every job card, the candidate sees:
   - Match Percentage Badge (e.g. `85% Match`)
   - Matched Skills (highlighted in green)
   - Missing Skills prioritized by urgency (e.g. "High Priority: Docker, Medium: Redis")
   - Direct link to official application page.

---

## 9. Leaderboard, Group Rankings & Career Readiness Engine

* **Source File:** `backend/src/services/rankingService.js`

### 9.1 The 6-Factor Ranking Formula
For cohort-based classrooms, university batches, and mentor groups:

$$\text{Ranking Score} = (\text{Practice} \times 0.30) + (\text{Projects} \times 0.20) + (\text{GitHub} \times 0.15) + (\text{LeetCode} \times 0.15) + (\text{Skills} \times 0.10) + (\text{Activity} \times 0.10)$$

### 9.2 Real-time Rank Movements & Notifications
* Calculates rank position changes ($\Delta \text{Rank} = \text{Previous Rank} - \text{Current Rank}$).
* If a candidate climbs in rank, an automated real-time notification is pushed to their notification feed.

### 9.3 Career Readiness Tiers
A combined index of Profile Completeness ($40\%$) and Total Score ($60\%$):
* **Top Performer**: Combined Score $\ge 85$
* **Interview Ready**: Combined Score $70 - 84$
* **Job Ready**: Combined Score $55 - 69$
* **Developing**: Combined Score $35 - 54$
* **Beginner**: Combined Score $< 35$

---

## 10. AI Mock Interview & Evaluation Engine

* **Source Files:** `backend/src/controllers/mockInterviewController.js`, `backend/src/services/ai/aiRouter.js`

### 10.1 Real-Time Chat & Voice Interview Simulation
* Role-based simulated interviews (Frontend, Backend, Full Stack, DevOps, Data Science).
* Candidates answer question-by-question via text or voice speech-to-text.
* The LLM grades the answer on a 0–100 scale on:
  - Technical accuracy
  - Completeness & clarity
  - Edge case awareness
  - Constructive suggestions for improvement

### 10.2 Resilient Multi-Tier AI Architecture
1. **Tier 1 (Ollama HuggingFace Space)**: Free open-weights inference (Llama 3 / DeepSeek).
2. **Tier 2 (Groq Cloud)**: Sub-second latency cloud inference.
3. **Tier 3 (WebLLM)**: Client-side in-browser WebGPU model execution.
4. **Tier 4 (Static Bank)**: 500+ curated technical questions ensure the platform **never crashes** if all AI APIs are offline.

---

## 11. Role-Based Access Control (RBAC) & Security Layer

### 11.1 User Roles & Permissions

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Candidate** | Upload resume, take coding practice quizzes, link GitHub/LeetCode, browse matched jobs, take AI mock interviews, view personal trust score. |
| **HR / Recruiter** | Search talent pool, filter candidates by Trust Score & Fraud Risk, view verified candidate profiles, download verified resumes, manage hiring pipeline status (Shortlist / Reject / Hire). |
| **Teacher / Mentor** | Create student workspaces & groups, assign practice challenges, monitor cohort leaderboards, review student skill gaps, add mentor endorsements. |
| **Admin** | System health monitoring, Prometheus metrics review, AI worker queue oversight, global platform configuration. |

### 11.2 Security Implementations
* **IDOR (Insecure Direct Object Reference) Protection**: Candidates can only access their own score breakdown and risk logs (`canReadUser` middleware).
* **Cross-Site Request Forgery (CSRF)**: Cryptographically signed tokens (`x-csrf-token`) validated on all state-mutating requests.
* **Rate Limiting**: Tiered rate limiters protect auth endpoints from brute-force attempts and AI endpoints from quota exhaustion.
* **Sanitized File Serving**: Resumes are served through custom route middleware with ownership verification, completely blocking directory traversal attacks.

---
*Documented and maintained for the Smart Resume Verifier Architecture.*
