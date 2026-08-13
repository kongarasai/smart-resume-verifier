# Web Frontend (Next.js)

This directory contains the **Web Frontend** codebase for the Smart Resume Verifier.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS & Vanilla CSS
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **Real-Time updates:** Socket.IO Client

## Running Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Next.js Static Export & Android APK Sync
Because the native Android application (`native-kotlin-app`) loads the frontend locally via WebView, any updates you make to this frontend codebase must be exported and copied to the Android assets directory before compilation:

1. Build & Export static files:
   ```bash
   npm run build
   ```
   This compiles and exports static HTML/JS/CSS assets to the `frontend/out` folder.

2. Copy the exported assets to the Kotlin project assets folder:
   * **Source:** `frontend/out/*`
   * **Destination:** `native-kotlin-app/app/src/main/assets/`

3. Compile the Kotlin Android app:
   ```bash
   cd ../native-kotlin-app
   ./gradlew assembleDebug
   ```
