# Interaction Mining (ODIM)

A privacy‑preserving, open‑source platform for collecting, managing, and analyzing organic user task flows from mobile apps.

> ODIM (On‑Device Interaction Mining) consists of an Android client that captures interaction data and a Next.js web app that stores, visualizes, and analyzes the collected flows.

---

## About the Project

Interaction Mining is a privacy-preserving open-source platform for collecting, managing, and sharing organic user task flows from mobile apps. In other words, it allows you to capture what real users do inside apps such as screens, UI interactions, and navigation paths directly from their devices. ODIM, abbreviated as On Device Interaction Mining, is a Next.js (React) web app that receives the data from the Android client, stores it (in a database and object storage), and provides a UI to visualize and analyze the collected interaction flows. 
---

## Features

* **Automated Interaction Capture**

  * Uses Android’s Accessibility Service API to record user actions (taps, scrolls, text input) and screen content in the background, automatically generating task flows from real app use.

* **Privacy‑Preserving Data Collection**

  * Sensitive on-screen data is automatically detected and masked (e.g., passwords, personal info). All data stays private and under user control via self-hosted storage.

* **Data Management & Visualization**

  * Next.js web app to browse, replay, and analyze recorded flows to study user behavior, UI patterns, and pain points.

* **Cloud or Local Storage Integration**

  * Stores screenshots and metadata in MongoDB plus MinIO or AWS S3. Easily configurable via environment variables for local or cloud setup.

* **User Authentication & Contributions**

  * Supports Google OAuth login for managing contributors or shared datasets. Optional for personal, single‑user deployments.

* **Extensible & Open Source**

  * Fully open source and customizable—extend for new analyses, visualizations, or data sources. Future plans may include iOS support.

---

## Architecture

* **Next.js App Router** under `src/app/`

  * Representative routes:

    * `/explore` – browse datasets or flows
    * `/contribute` – contributor instructions/upload
    * `/api/auth` – NextAuth authentication endpoints
* **Backend / API layer** via Next.js API routes (Node.js) to accept data from the Android client and serve frontend requests.
* **Database and object storage**

  * MongoDB for metadata (flows, users, etc.)
  * MinIO or AWS S3 for large assets (screenshots)
* **Auth**

  * NextAuth.js with Google OAuth 2.0 (optional)
* **State management**

  * React hooks and context; integrate other libraries as needed.

> Note: Folder names and exact routes may differ; adapt this README to your repo’s structure as needed.

---

## Tech Stack

* **Framework:** Next.js (React) with the App Router
* **Frontend:** React (functional components and hooks)
* **Styling:** Tailwind CSS or another utility‑first framework (depending on project setup)
* **Icons:** `lucide-react`
* **Backend/API:** Next.js API routes on Node.js
* **Database:** MongoDB (local or Atlas)
* **Object Storage:** MinIO (local S3) or AWS S3
* **Auth:** NextAuth.js (Google OAuth 2.0)

---

## Getting Started

### Prerequisites

* **Node.js** v16 or v18 LTS (includes npm)

  Verify:

  ```bash
  node -v
  npm -v
  ```

* **MongoDB**

  * Local: MongoDB Community Edition, or
  * Cloud: MongoDB Atlas URI

* **Docker** (optional but recommended)

  * Needed if you want to run a local MinIO server instead of AWS S3.

* **Android Studio**

  * Android SDK Platform API 34 (Android 14)
  * Build Tools 30.0.3+
  * Kotlin plugin 1.7.20+
  * Java JDK 17+

* **Android Device or Emulator**

  * Android 7.0+ (11+ recommended)
  * Enable Developer Options and grant Accessibility Service permission after installing the APK

* **Google Cloud OAuth credentials** (optional)

  * Needed only if enabling Google Sign-In for multi-user access.
  * Get your Client ID and Secret from Google Cloud Console.

### Installation Guide

#### 1) Clone the repositories

```bash
git clone https://github.com/datadrivendesign/interaction-mining.git
git clone https://github.com/datadrivendesign/odim-android.git
```

You should now have two folders:

* `interaction-mining` (web app)
* `odim-android` (Android client)

#### 2) Install web app dependencies

```bash
cd interaction-mining
npm install
```
This installs all required Node.js packages for the Next.js web app.


### Set Up Environment Variables

Create a `.env.local` file inside the `interaction-mining` directory with values appropriate for your environment.

Core configuration:

```bash
# Database
DATABASE_URL=mongodb://localhost:27017/odim

# Public URL used by the web app
NEXT_PUBLIC_DEPLOYMENT_URL=http://<your-ip>:3000

# Object Storage (choose MinIO or AWS S3 for screenshots)
USE_MINIO_STORE=true
AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=password
AWS_UPLOAD_BUCKET=odim-bucket
MINIO_ENDPOINT=http://<your-ip>:9000

# NextAuth / Google OAuth (optional)
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
NEXTAUTH_SECRET=<generated-secret>
```

Tip: Generate a strong NextAuth secret:

```bash
npx @next-auth/secret
```

### Storage and Database Setup

#### MongoDB (local)

* Start your local server (example for macOS with Homebrew):

```bash
brew services start mongodb-community@8.0
```

#### MinIO (local S3 alternative)

Run with Docker:

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=admin -e MINIO_ROOT_PASSWORD=password \
  -v minio_data:/data quay.io/minio/minio server /data --console-address ":9001"
```

Then visit `http://localhost:9001` and create a bucket named `odim-bucket`.

If using AWS S3 instead of MinIO, skip the MinIO step and provide valid AWS credentials and bucket name.

### Google OAuth Setup (Optional)

If you want to enable Google Sign‑In, configure credentials in Google Cloud Console. Add the following as an authorized redirect URI:

```
http://localhost:3000/api/auth/callback/google
```
### Build and Run

#### Development
```bash
npm run dev
```

#### Production

```bash
npm run build
npm start
```

#### Quick Setup (macOS only)

A helper script may be available:

```bash
./install.sh
```
This installs dependencies, starts MongoDB and MinIO, and generates `.env.local` automatically.

## Run the Web App Locally

### Start the Server
```bash
cd interaction-mining
npm install
npm run dev
```
* Starts the app at `http://localhost:3000` (or your configured IP)
* Open the URL in your browser — you should see the homepage or login screen.

## Verify Your Setup

* Check that `.env.local` contains the correct values (especially `DATABASE_URL` and storage configuration)
* Ensure MongoDB is running locally or that your Atlas URI is reachable
* Ensure MinIO or AWS S3 credentials are valid
* Watch terminal logs for a successful MongoDB connection
* Explore the UI at `http://localhost:3000` (`/explore`, `/contribute`)
* Any new data you upload will appear in the dataset explorer view.

---

## Troubleshooting

* **`MongoError: connection refused`**

  * Ensure MongoDB is running
* **Web app not loading**

  * Double‑check `DATABASE_URL` and restart the app
* **Auth errors or missing env values**

  * Review `.env.local` and restart after updates

---

## Contact

For questions, bug reports, or support, please open an issue on the repository’s GitHub Issues page. For sensitive inquiries (e.g., security concerns), reach out privately via email if listed in the repository; otherwise use Issues.

---

## Research Group

Developed by the Data‑Driven Design Group at the University of Illinois Urbana‑Champaign. For research collaborations or academic inquiries, visit the [project website](https://www.interactionmining.org/) or Prof. Ranjitha Kumar’s page.

---

## Community & Discussion

A GitHub Discussions board or Slack/Discord may be created as community interest grows. Check the repository for updates.

---

## Report Bugs or Request Features

Use the GitHub Issue tracker to report bugs or suggest enhancements. This is the fastest and most transparent way to reach the maintainers and to help other users with similar issues.
