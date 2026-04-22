# LoKally Nepal

LoKally Nepal is a community-driven travel discovery web platform designed to help users discover, share, and verify hidden and lesser-known travel destinations across Nepal. The project was developed as a Final Year Project and combines community content, interactive maps, visit verification, and AI-powered place recommendations in one platform.

## Project Overview

Mainstream travel platforms often focus on popular destinations, leaving many local and lesser-known places underrepresented. LoKally Nepal addresses this gap by providing a Nepal-focused platform where users can:

- discover unique travel places across Nepal
- submit and share hidden destinations
- explore approved places on an interactive map
- verify visits with photo proof
- interact through posts, comments, reactions, and bookmarks
- receive AI-powered recommendations based on interests and place data
- earn reward points and compete on the leaderboard

## Core Features

### 1. User Authentication
- Register with email and password
- Email verification before login
- JWT-based login session
- Google OAuth login
- Forgot password with OTP
- Change password and delete account from settings

### 2. Place Submission and Management
- Submit a place with category, address, GPS location, description, and images
- Submitted places remain pending until admin review
- Admin can approve or reject submitted places
- Users can track the status of their submitted places in their profile

### 3. Interactive Map Exploration
- Explore approved places on a Leaflet.js map
- View places using OpenStreetMap tiles
- Filter by category
- View place details including images, description, tags, and distance
- Use distance measurement and routing support

### 4. AI-Powered Recommendations
- Recommendation service built with Python FastAPI
- Uses TF-IDF and KNN-based recommendation logic
- Supports tag-based matching and nearby place suggestions
- Runs as a separate service outside Docker in the current version

### 5. Community Posts
- Create posts with captions and images
- React using multiple reaction types
- Comment and reply in nested threads
- Bookmark posts
- Report inappropriate content
- Trending feed based on recency and engagement

### 6. Visit Verification
- Submit visit proof with travel date, experience, and photo
- Admin verifies the visit request
- Approved visits reward users with points

### 7. Rewards and Leaderboard
- Earn points through platform activity
- Daily login, likes, comments, posts, submissions, and approvals are rewarded
- Users progress through levels such as Newcomer, Rising, Skilled, Expert, and Elite
- Leaderboard ranks users based on total points

### 8. Notifications
- Real-time style polling-based notifications
- Read/unread handling
- Navigate directly to relevant content from notifications

### 9. Contact Us and Admin Inbox
- Users can send support messages
- Each contact request gets a reference number
- Admin can reply through the panel
- Replies are stored in threads and also sent to users

### 10. Admin Management Panel
- Dashboard with summary statistics
- Manage places, visit verifications, users, posts, and contact conversations
- Moderate reports and platform activity

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Leaflet.js / React Leaflet
- React Router DOM
- React Hook Form

### Backend
- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL
- JWT Authentication
- Nodemailer
- Passport Google OAuth
- Firebase Admin

### AI Service
- Python FastAPI
- TF-IDF
- KNN-based recommendation engine

### DevOps / Tools
- Docker Compose
- PostgreSQL 15
- pgAdmin 4

## Project Structure

```bash
LoKally/
├── backend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
├── docker-compose.yml
├── package.json
└── .gitignore
```

## System Architecture

- **Frontend:** Handles UI, map exploration, forms, community features, and admin panel views
- **Backend:** Handles APIs, authentication, database operations, notifications, contact management, and moderation logic
- **Database:** Stores users, places, posts, visits, comments, points, notifications, and contact data
- **AI Service:** Provides recommendation and nearby place suggestions

## Default Local Ports

| Service | Port |
|---|---:|
| Frontend | 5173 |
| Backend | 5001 |
| PostgreSQL | 5432 |
| pgAdmin | 5050 |
| AI Recommendation Service | 8000 |

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js 20+
- npm
- Python 3.x
- Docker Desktop / Docker Engine
- PostgreSQL client tools (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/punamyba/LoKally.git
cd LoKally
```

### 2. Start Database Services with Docker

This project currently uses Docker Compose for **PostgreSQL** and **pgAdmin**.

```bash
docker compose up -d
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Run the Backend Server

```bash
npm run dev
```

### 5. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 6. Run the Frontend

```bash
npm run dev
```

### 7. Run the AI Recommendation Service

The AI recommendation service runs separately from Docker in this version.

Example startup command:

```bash
uvicorn recommend_api:app --reload --port 8000
```

> If your local AI entry file or app name is different, update the command accordingly.

## Environment Configuration

Create your local environment files before running the project.

### Backend `.env`
Configure values such as:
- database name, username, password, host, and port
- JWT secret
- Gmail SMTP email and app password
- Google OAuth client credentials
- frontend/base URL
- Firebase admin credentials path

### Frontend `.env`
Configure values such as:
- backend API base URL
- frontend Firebase client configuration
- any OAuth-related frontend configuration used in the project

> Keep real secrets out of GitHub. This repository already ignores `.env` files and local uploads.

## Docker Compose Notes

The current `docker-compose.yml` provisions:
- PostgreSQL 15
- pgAdmin 4

In the current version:
- the backend is run locally with Node.js
- the frontend is run locally with Vite
- the AI recommendation service is started manually with Python/FastAPI

## Available Scripts

### Backend
```bash
npm run dev
```
Starts the backend server using Nodemon.

### Frontend
```bash
npm run dev
```
Starts the Vite development server.

```bash
npm run build
```
Builds the production frontend.

```bash
npm run lint
```
Runs ESLint.

```bash
npm run preview
```
Previews the production frontend build.

## Database Models

The project includes models such as:

- User
- Place
- PlaceVisit
- PlaceLike
- PlaceComment
- PlaceRating
- PlaceCondition
- PlaceTag
- Post
- PostLike
- PostComment
- PostReport
- Bookmark
- PointsHistory
- Notification
- ContactConversation
- ContactMessage
- LoginStreak

## Testing and Debugging

Testing for the project covered multiple API categories including authentication, places, AI recommendations, community posts, admin functions, visit verification, points, notifications, and contact handling.

During development, several bugs were identified and fixed, including:
- wrong FastAPI module naming
- incorrect upload folder references
- SMTP connection issues
- Sequelize column typos
- CORS misconfiguration
- route path issues
- invalid JWT secret usage
- empty response mapping problems

## Key Implementation Notes

- Images are stored on the local file system in the current version
- Email failures are handled without crashing the app
- Cascade delete is used for related database records
- `.env` changes require `docker compose down` and `docker compose up` again instead of only restarting containers
- Google OAuth callback is configured for local development

## Similar Platforms Considered

LoKally Nepal was compared conceptually with:
- TripAdvisor
- Komoot
- Atlas Obscura
- Nepal Tourism Board platform

Its key uniqueness is the combination of:
- Nepal-specific focus
- community-submitted hidden places
- GPS/map-based exploration
- visit verification
- AI recommendation support
- gamified points and leaderboard system

## Future Improvements

Possible future enhancements include:
- containerizing the AI service
- deploying the project to cloud infrastructure
- using cloud image storage instead of local uploads
- stronger recommendation personalization
- real-time notifications via WebSockets
- mobile app support

## Academic Context

This project was developed as a **Final Year Project** using an **Agile Scrum** methodology across multiple sprints.

## Author

**Samjhana Tamang**  
Final Year Project  
CS6P05NI

## Repository

GitHub: [punamyba/LoKally](https://github.com/punamyba/LoKally)
