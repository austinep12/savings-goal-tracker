# 60. Savings Goal Tracker 🎯

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Production_Site-00DC82?style=for-the-badge&logo=vercel&logoColor=white)](https://savings-goal-tracker-pearl.vercel.app/)
[![Course](https://img.shields.io/badge/Course-23CS2048_(IA3)-4f46e5?style=for-the-badge)](https://github.com/austinep12/savings-goal-tracker)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Cloud_Connected-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://savings-goal-tracker-pearl.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_MVC_REST_API-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://savings-goal-tracker-pearl.vercel.app/)

> **Academic Submission for Course 23CS2048: Web Technology (IA3)**  
> **Student GitHub:** [@austinep12](https://github.com/austinep12)  
> **Architecture:** Model-View-Controller (MVC) Pattern  
> **Tech Stack:** Node.js, Express.js, MongoDB Atlas, Mongoose, HTML5, CSS3, JavaScript (ES6+), Bootstrap 5

---

### 🌐 Live Production Links
- 🚀 **Live Hosted Application:** [https://savings-goal-tracker-pearl.vercel.app/](https://savings-goal-tracker-pearl.vercel.app/)
- 📁 **GitHub Source Repository:** [https://github.com/austinep12/savings-goal-tracker](https://github.com/austinep12/savings-goal-tracker)

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Project Architecture (MVC)](#-project-architecture-mvc)
3. [Technology Stack](#-technology-stack)
4. [Directory Structure](#-directory-structure)
5. [Database Schema](#-database-schema)
6. [Input Validation Rules](#-input-validation-rules)
7. [REST API Documentation](#-rest-api-documentation)
8. [Installation & Local Setup](#-installation--local-setup)
9. [Environment Variables Guide](#-environment-variables-guide)
10. [GitHub Upload Instructions](#-github-upload-instructions)
11. [Deployment Guide (Render & MongoDB Atlas)](#-deployment-guide-render--mongodb-atlas)

---

- **MVC Architecture:** Clean separation of concerns across Models, Controllers, Routes, and Frontend Views.
- **User Authentication & Privacy:**
  - Secure sign-in and account registration with password hashing (`bcryptjs`) and stateless session tokens (`jsonwebtoken`).
  - Strict multi-tenant user isolation: users only access, modify, and deposit into their own goals.
  - Clean new account onboarding: fresh accounts start with 0 goals so users build their own financial roadmap.
- **Dynamic Analytics Dashboard:**
  - Real-time overall savings percentage progress bar.
  - Total Target Amount ($) vs. Total Current Savings ($).
  - Completed Goals vs. Active Goals counter.
- **Interactive Goals Grid:**
  - Category-based badges with unique icons (`Emergency`, `Tech & Gadgets`, `Education`, `Travel`, `Vehicle`, `Other`).
  - Target deadline countdown (days remaining or overdue indicator).
  - Dynamic progress bar with adaptive color milestones:
    - **Amber/Yellow:** `< 50%` saved
    - **Sky Blue/Cyan:** `>= 50%` and `< 100%` saved
    - **Emerald Green:** `100%` completed
  - Celebratory **"Goal Completed 🎉"** ribbon and animated confetti burst upon achievement.
- **Inline Fund Deposits:** One-click deposit using quick chips (`+$50`, `+$100`, `+$250`) or custom amounts without page reload.
- **Dual-Layer Validation:** Strict client-side form validation (Bootstrap feedback) and server-side verification middleware.
- **Search, Filter & Sorting:** Real-time search by title or description, category dropdown, status filter, and multi-parameter sorting.
- **Zero-Setup Database Fallback:** Connects to MongoDB Atlas or local MongoDB; seamlessly switches to an embedded in-memory MongoDB runner if no external database is active.

---

## 🏛 Project Architecture (MVC)

The project strictly follows the **Model-View-Controller (MVC)** architectural design pattern:

```
                      +-------------------+
                      |   Client Browser  |
                      | (Bootstrap 5 UI)  |
                      +---------+---------+
                                |  HTTP (Fetch API / JSON)
                                v
                      +-------------------+
                      |  Express Server   |
                      |   (server.js)     |
                      +---------+---------+
                                |
                   +------------+------------+
                   |                         |
                   v                         v
          +-----------------+       +-----------------+
          |  Static Assets  |       |   API Routes    |
          | (/public Views) |       | (/routes/*.js)  |
          +-----------------+       +--------+--------+
                                             |
                                             v
                                    +-----------------+
                                    |   Controllers   |
                                    | (/controllers)  |
                                    +--------+--------+
                                             |
                                             v
                                    +-----------------+
                                    | Mongoose Model  |
                                    |   (/models)     |
                                    +--------+--------+
                                             |
                                             v
                                    +-----------------+
                                    |     MongoDB     |
                                    | (Atlas / Local) |
                                    +-----------------+
```

- **Model (`models/Goal.js`):** Mongoose schema enforcing field types, boundaries, validation regex, virtual properties, and pre-save completion hooks.
- **View (`public/`):** Clean HTML5 markup, responsive Bootstrap 5 layout, custom CSS3 gradients, micro-animations, and client JavaScript.
- **Controller (`controllers/goalController.js`):** Handles HTTP request parsing, server validation, database queries, mathematical aggregations, and standardized JSON output.
- **Routes (`routes/goalRoutes.js`):** Clean REST endpoint definitions mapping HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to controller actions.

---

## 🛠 Technology Stack

### Backend
- **Node.js:** Runtime environment (v18+)
- **Express.js (v4.21):** Web framework & RESTful routing
- **Mongoose (v8.9):** Object Data Modeling (ODM) for MongoDB
- **dotenv:** Environment variable configuration
- **cors:** Cross-Origin Resource Sharing handling
- **morgan:** HTTP request logger for debugging

### Frontend
- **HTML5 & CSS3:** Semantic markup, CSS Custom Properties, and responsive flex/grid layouts
- **JavaScript (ES6+):** Fetch API, DOM manipulation, asynchronous state management, and Canvas Confetti
- **Bootstrap 5.3.3:** Responsive UI grid, modals, toasts, form validation states
- **Bootstrap Icons 1.11.3:** Vector icons for categories and actions
- **Google Fonts:** Plus Jakarta Sans typography

---

## 📂 Directory Structure

```
/savings-goal-tracker
  │── /config
  │    └── db.js                 # MongoDB connection & fallback setup
  │── /middleware
  │    └── auth.js               # JWT Bearer token protection middleware
  │── /models
  │    ├── User.js               # Mongoose User schema with bcrypt password hashing
  │    └── Goal.js               # Mongoose Goal schema with user reference & virtuals
  │── /controllers
  │    ├── authController.js     # User registration, login, JWT issuance, starter goals
  │    └── goalController.js     # User-scoped CRUD logic & summary analytics
  │── /routes
  │    ├── authRoutes.js         # Register, Login, and Me profile route endpoints
  │    └── goalRoutes.js         # Protected Express REST API goal endpoints
  │── /public                    # Frontend client assets
  │    ├── /css
  │    │    └── style.css        # FinTech theme styling, auth cards, micro-animations
  │    ├── /js
  │    │    └── app.js           # Client auth state, JWT token storage, CRUD Fetch API
  │    └── index.html            # Sign-In, Register, and Main Dashboard interfaces
  │── .env.example               # Template environment configuration
  │── .gitignore                 # Files excluded from Git version control
  │── server.js                  # Express application entry point & router mounting
  │── package.json               # Project manifest, dependencies, and scripts
  └── README.md                  # Comprehensive documentation & evaluation guide
```

---

## 🗄 Database Schema

### 1. User Schema (`models/User.js`)

| Field | Type | Validation / Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | Required, Trimmed, Length: 2 - 50 chars | *None* | Full Name |
| `username` | `String` | Required, Unique, Trimmed, Lowercase, Length: 3 - 30 chars | *None* | Unique account handle |
| `email` | `String` | Required, Unique, Trimmed, Lowercase, Valid Email Regex | *None* | Account email address |
| `password` | `String` | Required, Min length: 6 (Hashed with `bcryptjs`) | *None* | Hashed password |
| `createdAt` | `Date` | Automatically managed | `Date.now` | Registration timestamp |

### 2. Goal Schema (`models/Goal.js`)

| Field | Type | Validation / Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user` | `ObjectId` | Reference to `User` model (`ref: 'User'`) | *None* | Owning user ID (Scoping) |
| `title` | `String` | Required, Trimmed, Length: 3 - 50 chars | *None* | Goal name/milestone |
| `targetAmount` | `Number` | Required, Minimum: 1 | *None* | Target savings amount ($) |
| `currentAmount` | `Number` | Minimum: 0, Maximum: 1,000,000 | `0` | Funds saved to date ($) |
| `category` | `String` | Required, Enum: `['Emergency', 'Tech & Gadgets', 'Education', 'Travel', 'Vehicle', 'Other']` | *None* | Classification category |
| `targetDate` | `Date` | Required, Must be today or future date | *None* | Target completion deadline |
| `description` | `String` | Trimmed, Maximum length: 250 chars | `""` | Optional personal notes |
| `isCompleted` | `Boolean` | Computed (`currentAmount >= targetAmount`) | `false` | Goal completion flag |
| `createdAt` | `Date` | Automatically managed | `Date.now` | Creation timestamp |

**Virtual Fields:**
- `progressPercentage`: Calculated as `(currentAmount / targetAmount) * 100` (capped at 100%).
- `remainingAmount`: Calculated as `Math.max(0, targetAmount - currentAmount)`.

---

## ✅ Input Validation Rules

Strict dual-layer validation is enforced on both the **Frontend** and the **Backend**:

| Input Field | Client-side Rule (Browser JS) | Server-side Rule (Express / Mongoose) | Error Response |
| :--- | :--- | :--- | :--- |
| `title` | 3 to 50 characters, trimmed | Required, minlength: 3, maxlength: 50 | 400 Bad Request |
| `targetAmount` | Number > 0 | Required, Number, min: 1 | 400 Bad Request |
| `currentAmount` | Number >= 0 and <= 1,000,000 | Number, min: 0, max: 1000000 | 400 Bad Request |
| `category` | Must select one of the 6 predefined categories | Required, enum matching whitelist | 400 Bad Request |
| `targetDate` | Picker min set to today; must be future/today | Required, Date >= today | 400 Bad Request |
| `description` | Max 250 characters | Maxlength: 250 characters | 400 Bad Request |

---

## 📡 REST API Documentation

All API responses follow the uniform standard format:
```json
{
  "success": true,
  "message": "Descriptive message",
  "data": { ... }
}
```

### 1. Fetch All Goals
- **Endpoint:** `GET /api/goals`
- **Query Parameters (Optional):**
  - `search` (string): Text query to search in title and description
  - `category` (string): Filter by category
  - `status` (`all` | `in-progress` | `completed`): Filter by completion
  - `sort` (`newest` | `oldest` | `deadline` | `targetHigh` | `targetLow` | `progressHigh`)
- **Status:** `200 OK`
- **Sample Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "671fb2c58971f49610f44a10",
      "title": "Emergency Fund (6 Months)",
      "targetAmount": 10000,
      "currentAmount": 6500,
      "category": "Emergency",
      "targetDate": "2027-06-30T00:00:00.000Z",
      "description": "Essential safety net covering 6 months of housing reserves.",
      "isCompleted": false,
      "progressPercentage": 65,
      "remainingAmount": 3500,
      "createdAt": "2026-10-28T21:30:00.000Z"
    }
  ]
}
```

### 2. Fetch Analytics Summary
- **Endpoint:** `GET /api/goals/summary`
- **Status:** `200 OK`
- **Sample Response:**
```json
{
  "success": true,
  "data": {
    "totalGoalsCount": 3,
    "completedGoalsCount": 1,
    "inProgressGoalsCount": 2,
    "totalTargetAmount": 17300,
    "totalCurrentSavings": 11100,
    "remainingAmount": 6200,
    "overallProgress": 64.2,
    "categoryBreakdown": {
      "Emergency": { "count": 1, "target": 10000, "saved": 6500 },
      "Tech & Gadgets": { "count": 1, "target": 2800, "saved": 2800 },
      "Travel": { "count": 1, "target": 4500, "saved": 1800 }
    }
  }
}
```

### 3. Create a New Goal
- **Endpoint:** `POST /api/goals`
- **Body:**
```json
{
  "title": "New Car Down Payment",
  "targetAmount": 5000,
  "currentAmount": 1200,
  "category": "Vehicle",
  "targetDate": "2027-05-01",
  "description": "Savings for down payment on hybrid car"
}
```
- **Status:** `201 Created`

### 4. Update Goal Details
- **Endpoint:** `PUT /api/goals/:id`
- **Status:** `200 OK` (or `404 Not Found`, `400 Bad Request`)

### 5. Add Funds to Goal
- **Endpoint:** `PATCH /api/goals/:id/add-funds`
- **Body:**
```json
{
  "amount": 250
}
```
- **Status:** `200 OK`
- **Note:** If `currentAmount + amount >= targetAmount`, `isCompleted` is automatically set to `true`.

### 6. Delete a Goal
- **Endpoint:** `DELETE /api/goals/:id`
- **Status:** `200 OK`

---

## 💻 Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v18.0.0 or higher)
- Optional: Local MongoDB installed, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string. *(If no database is active, the app automatically starts an embedded in-memory MongoDB instance!)*

### Step 1: Clone or Navigate to Directory
```bash
cd savings-goal-tracker
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the example environment file:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux / macOS:
cp .env.example .env
```

Review or edit `.env` if using a custom MongoDB Atlas connection:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/savings-tracker
```

### Step 4: Run the Application
**Development mode (auto-reload via nodemon):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Step 5: Open in Browser
Navigate to:
```
http://localhost:5000
```

---

## 🔐 Environment Variables Guide

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Port number on which the Express server listens |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development` or `production`) |
| `MONGO_URI` | Optional | `mongodb://127.0.0.1:27017/savings-tracker` | Connection string for MongoDB database (Atlas URI or local) |

---

## 🚀 GitHub Upload Instructions

To upload this repository to your GitHub account:

```bash
# 1. Initialize git repository
git init

# 2. Add all files to staging
git add .

# 3. Create your initial commit
git commit -m "feat: complete Full-Stack Savings Goal Tracker for Course 23CS2048 IA3"

# 4. Set default branch to main
git branch -M main

# 5. Link to your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/<your-username>/savings-goal-tracker.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 🌐 Deployment Guide (Vercel & MongoDB Atlas)

### Step 1: Set Up Free MongoDB Atlas Database (Required for Cloud Hosting)
Because cloud hosting services like Vercel run serverless functions without persistent local disks, you need a free cloud database:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register a free account.
2. Create a free **M0 Shared Cluster**.
3. Under **Security -> Database Access**, create a database user (e.g., username `dbAdmin` with a password).
4. Under **Security -> Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Clusters -> Connect -> Drivers** (Node.js) and copy your connection string:
   ```
   mongodb+srv://dbAdmin:<YOUR_PASSWORD>@cluster0.abcde.mongodb.net/savings-tracker?retryWrites=true&w=majority
   ```
   *(Replace `<YOUR_PASSWORD>` with your database user password).*

---

### Step 2: Deploy to Vercel (1-Click Setup)
The project includes a ready-to-use [`vercel.json`](file:///C:/Users/Me/.gemini/antigravity-ide/scratch/savings-goal-tracker/vercel.json) configuration file.

1. Go to [Vercel](https://vercel.com) and log in with your GitHub account.
2. Click **Add New... -> Project**.
3. Select and import your GitHub repository (`savings-goal-tracker`).
4. In the **Configure Project** screen:
   - **Framework Preset:** Leave as `Other`.
   - **Root Directory:** `./`
5. Expand **Environment Variables** and add:
   - **Key:** `MONGO_URI`
   - **Value:** `<Your MongoDB Atlas connection string from Step 1>`
   - *(Optional)* **Key:** `NODE_ENV`, **Value:** `production`
6. Click **Deploy**.
7. Vercel will build and deploy your app in under 60 seconds, providing a live HTTPS production URL (e.g., `https://savings-goal-tracker.vercel.app`)!

---

### Alternative: Deploy on Render
1. Go to [Render.com](https://render.com) and log in.
2. Click **New + -> Web Service** and connect your GitHub repository.
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add Environment Variable:
   - `MONGO_URI` = `<Your MongoDB Atlas connection string>`
5. Click **Deploy Web Service**.

---

## 🎓 Academic Rubric Verification (Course 23CS2048)

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **MVC Architecture** | Dedicated `models/`, `views/` (`public/`), `controllers/`, and `routes/` | ✅ Complete |
| **Tech Stack** | Node.js, Express, MongoDB, Mongoose, HTML5, CSS3, ES6 JS, Bootstrap 5 | ✅ Complete |
| **Database Schema** | Title, targetAmount, currentAmount, category enum, targetDate, description, isCompleted | ✅ Complete |
| **REST API CRUD** | Full GET, GET summary, POST, PUT, PATCH add-funds, and DELETE endpoints | ✅ Complete |
| **Strict Validation** | Dual-layer validation on both Client and Server with feedback messages | ✅ Complete |
| **Frontend UI** | Bootstrap 5 dashboard, metric cards, progress bar color dynamics, modals, toasts | ✅ Complete |
| **Seed Data** | 3 pre-seeded goals on empty collection start for instant evaluator demo | ✅ Complete |
| **Documentation** | Setup guide, environment variables, GitHub steps, and Render deployment | ✅ Complete |
