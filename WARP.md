# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Backend Development
```bash
# Start the backend server (from root directory)
npm start

# Start from backend directory  
cd backend-bank && node bankServer.js

# Install backend dependencies
cd backend-bank && npm install
```

### Frontend Development
```bash
# Start frontend development server
cd question-bank-frontend/project_name && npm run dev

# Build frontend for production
cd question-bank-frontend/project_name && npm run build

# Run linting
cd question-bank-frontend/project_name && npm run lint

# Install frontend dependencies
cd question-bank-frontend/project_name && npm install
```

### Full Stack Development
```bash
# Build frontend and serve via backend (production mode)
cd question-bank-frontend/project_name && npm run build
npm start

# For development: run both servers simultaneously
# Terminal 1: Backend
npm start
# Terminal 2: Frontend  
cd question-bank-frontend/project_name && npm run dev
```

## Architecture Overview

### Project Structure
This is a full-stack question bank/CBT (Computer-Based Testing) application with separate backend and frontend components:

- **Backend**: Express.js/Node.js REST API with MongoDB
- **Frontend**: React with Vite, using React Router for navigation
- **Authentication**: JWT-based with role-based access (admin/user)
- **Database**: MongoDB with Mongoose ODM

### Backend Architecture (`backend-bank/`)
- **Main Server**: `bankServer.js` - Express server with all endpoints and middleware
- **Models**: MongoDB schemas for Question, User, Class, Subject
- **Routes**: Modular route handlers for users, classes, subjects
- **Middleware**: Authentication and admin authorization
- **File Processing**: Support for uploading questions via .docx, .xlsx, .csv files

### Frontend Architecture (`question-bank-frontend/project_name/`)
- **Framework**: React 19 with Vite bundler
- **Routing**: React Router with protected routes
- **State Management**: Context API for authentication (`AuthContext`)
- **Pages**: Role-based pages (admin dashboard, CBT interface, question management)
- **Components**: Reusable components (Navbar, ProtectedRoute, ErrorBoundary)

### Data Models
- **Question**: text, options[], answer, topic, classId, subjectId
- **User**: username, password (hashed), role (admin/user), classId (for users)
- **Class**: name, timeLimit
- **Subject**: name, classId (linked to class)

### Key Features
- **Role-based access**: Admin can manage questions/users, Users take tests
- **Question linking**: Advanced linking system for related questions by topic
- **Batch operations**: Import/export questions in bulk
- **File upload**: Support for .docx, .xlsx, .csv question imports
- **Score tracking**: Excel-based score storage and history
- **CBT Interface**: Computer-based testing with timer functionality

## API Endpoints

### Authentication
- `POST /api/bank/auth/register` - User registration
- `POST /api/bank/auth/login` - User login (returns JWT)

### Questions (Protected)
- `GET /api/bank/questions` - List questions with pagination/filtering
- `POST /api/bank/questions` - Create question (admin only)
- `PUT /api/bank/questions/:id` - Update question (admin only)
- `DELETE /api/bank/questions/:id` - Delete question (admin only)
- `GET /api/bank/questions/:id/linked` - Get question with linked questions
- `POST /api/bank/questions/import` - Bulk import (admin only)
- `POST /api/bank/questions/upload` - File upload import (admin only)

### Classes & Subjects
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create new class (admin only)
- `PUT /api/classes/:id` - Update class (admin only)
- `DELETE /api/classes/:id` - Delete class and cascade delete subjects/questions (admin only)
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create new subject (admin only)
- `PUT /api/subjects/:id` - Update subject (admin only)
- `GET /api/subjects/class/:classId` - Get subjects for specific class
- `DELETE /api/subjects/:id` - Delete subject and cascade delete questions (admin only)

### Scores & Analytics
- `POST /api/save-score` - Save test score (enhanced with class/subject data)
- `GET /api/scores/history` - User score history
- `GET /api/scores/analytics` - Overall score analytics (admin only)
- `GET /api/scores/by-class/:classId` - Class-wise results with subject breakdown (admin only)
- `GET /api/scores/by-subject/:subjectId` - Subject-wise results (admin only)
- `GET /api/download-scores` - Download enhanced scores Excel (admin only)

## Environment Variables

The application requires these environment variables in `backend-bank/.env`:

```env
JWT_SECRET=your_secret_key
MONGO_URI=mongodb://localhost:27017/question-bank
PORT=4000
REACT_APP_API_URL=http://localhost:4000/api
```

**Note**: The server code references these variables but they may not be properly loaded. Check that `dotenv` configuration is correct and variables are defined.

## File Upload Format

When uploading questions via Excel/CSV, use these column headers:
- `text` or `Question` - Question text
- `option1`, `option2`, `option3`, `option4` - Answer options
- `answer` or `Answer` - Correct answer
- `topic` or `Topic` - Question topic/category  
- `classId` or `class` - Associated class ID
- `subjectId` - Associated subject ID (optional)

## Enhanced Score Tracking

The system now tracks detailed score information:
- **Individual scores** with percentages and pass/fail status (70% pass mark)
- **Subject-wise analytics** showing performance per subject
- **Class-wise breakdowns** with subject performance summaries
- **Time tracking** for test completion duration
- **Enhanced Excel export** with columns: Username, Score, Total Questions, Percentage, Class, Subject, Class ID, Subject ID, Time Taken, Date, Status

### Admin Results Dashboard
Access via `/results-dashboard` to:
- View overall system statistics
- Filter results by class and subject
- See detailed analytics and individual student performance
- Monitor pass/fail rates and average scores

## Development Notes

### Database Connection
The application uses MongoDB. Ensure MongoDB is running locally or update `MONGO_URI` for remote connection.

### Frontend-Backend Communication
- Frontend runs on Vite dev server (typically port 5173)
- Backend serves static frontend build in production
- CORS is configured to allow all origins during development

### Authentication Flow
1. User logs in via `/api/bank/auth/login`
2. JWT token stored in localStorage
3. Token included in Authorization header for protected routes
4. `AuthContext` manages authentication state globally

### Production Deployment
The backend serves the built React app from `question-bank-frontend/project_name/dist/`. Build the frontend first, then start the backend server.
