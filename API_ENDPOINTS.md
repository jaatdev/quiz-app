# API Endpoints Documentation

## Base URL
- **Backend**: `http://localhost:5001/api`

---

## Health Check

### `GET /health`
Check if the API server is running.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## User Endpoints

### `POST /user/sync`
Sync user from Clerk to database (create or update).

**Request Body:**
```json
{
  "clerkId": "user_xxxxx",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "id": "clxxx...",
  "clerkId": "user_xxxxx",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400`: Missing clerkId or email
- `500`: Database error

---

### `GET /user/profile/:clerkId`
Get user profile with recent quiz attempts.

**Response:**
```json
{
  "id": "clxxx...",
  "clerkId": "user_xxxxx",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "quizAttempts": [
    {
      "id": "clxxx...",
      "topicId": "topic_xxx",
      "score": 8,
      "totalQuestions": 10,
      "correctAnswers": 8,
      "percentage": 80.0,
      "timeSpent": 120,
      "difficulty": "medium",
      "completedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404`: User not found
- `500`: Database error

---

### `POST /user/quiz-attempt`
Save a quiz attempt for authenticated user.

**Request Body:**
```json
{
  "clerkId": "user_xxxxx",
  "topicId": "topic_xxx",
  "score": 8,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "percentage": 80.0,
  "timeSpent": 120,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "id": "clxxx...",
  "userId": "user_db_id",
  "topicId": "topic_xxx",
  "score": 8,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "percentage": 80.0,
  "timeSpent": 120,
  "difficulty": "medium",
  "completedAt": "2024-01-01T00:00:00.000Z",
  "topic": {
    "id": "topic_xxx",
    "name": "JavaScript Basics",
    "subject": {
      "id": "subject_xxx",
      "name": "Programming"
    }
  }
}
```

**Error Responses:**
- `400`: Missing clerkId
- `500`: User not found or database error

---

### `GET /user/history/:clerkId`
Get user's quiz history (last 50 attempts).

**Response:**
```json
[
  {
    "id": "clxxx...",
    "userId": "user_db_id",
    "topicId": "topic_xxx",
    "score": 8,
    "totalQuestions": 10,
    "correctAnswers": 8,
    "percentage": 80.0,
    "timeSpent": 120,
    "difficulty": "medium",
    "completedAt": "2024-01-01T00:00:00.000Z",
    "topic": {
      "id": "topic_xxx",
      "name": "JavaScript Basics",
      "subject": {
        "id": "subject_xxx",
        "name": "Programming"
      }
    }
  }
]
```

**Notes:**
- Returns empty array if user not found
- Ordered by completedAt (most recent first)
- Limited to 50 most recent attempts

---

### `GET /user/stats/:clerkId`
Get user statistics and performance metrics.

**Response:**
```json
{
  "user": {
    "id": "clxxx...",
    "name": "John Doe",
    "email": "user@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "stats": {
    "totalQuizzes": 15,
    "totalQuestions": 150,
    "correctAnswers": 120,
    "averageScore": "8.00",
    "averagePercentage": "80.00"
  }
}
```

**Error Responses:**
- `404`: User not found
- `500`: Database error

---

## Quiz Endpoints

### `GET /subjects`
Get all subjects with their topics.

**Response:**
```json
[
  {
    "id": "subject_xxx",
    "name": "Programming",
    "topics": [
      {
        "id": "topic_xxx",
        "name": "JavaScript Basics",
        "questionCount": 50
      }
    ]
  }
]
```

---

### `GET /topics/:topicId`
Get topic details.

**Response:**
```json
{
  "id": "topic_xxx",
  "name": "JavaScript Basics",
  "subjectId": "subject_xxx",
  "subject": {
    "id": "subject_xxx",
    "name": "Programming"
  },
  "questionCount": 50
}
```

---

### `GET /quiz/session/:topicId?count=10&difficulty=medium`
Start a new quiz session with random questions.

**Query Parameters:**
- `count` (optional): Number of questions (default: 10)
- `difficulty` (optional): easy, medium, hard (default: medium)

**Response:**
```json
{
  "sessionId": "session_xxx",
  "topicId": "topic_xxx",
  "topicName": "JavaScript Basics",
  "questions": [
    {
      "id": "question_xxx",
      "text": "What is a closure in JavaScript?",
      "options": [
        {
          "id": "option_1",
          "text": "A function inside another function"
        },
        {
          "id": "option_2",
          "text": "A loop construct"
        }
      ],
      "difficulty": "medium"
    }
  ],
  "duration": 600
}
```

---

### `POST /quiz/submit`
Submit quiz answers and get results.

**Request Body:**
```json
{
  "topicId": "topic_xxx",
  "answers": [
    {
      "questionId": "question_xxx",
      "selectedOptionId": "option_1"
    }
  ],
  "timeSpent": 120
}
```

**Response:**
```json
{
  "score": 8,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "percentage": 80.0,
  "incorrectAnswers": [
    {
      "questionId": "question_xxx",
      "correctOptionId": "option_2",
      "selectedOptionId": "option_1"
    }
  ]
}
```

---

### `POST /quiz/review`
Get detailed review of quiz with correct answers.

**Request Body:**
```json
{
  "topicId": "topic_xxx",
  "questionIds": ["question_xxx", "question_yyy"]
}
```

**Response:**
```json
{
  "questions": [
    {
      "id": "question_xxx",
      "text": "What is a closure?",
      "options": [
        {
          "id": "option_1",
          "text": "A function inside another function",
          "isCorrect": true
        }
      ],
      "correctOptionId": "option_1",
      "explanation": "Closures allow functions to access outer scope..."
    }
  ]
}
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (missing or invalid parameters)
- `404`: Resource not found
- `500`: Internal Server Error

---

## Authentication Flow

1. **Sign Up/Sign In**: User authenticates via Clerk (frontend)
2. **Profile Sync**: New user visits `/welcome` → calls `POST /user/sync`
3. **Quiz Attempt**: User completes quiz → calls `POST /user/quiz-attempt`
4. **View History**: User visits history page → calls `GET /user/history/:clerkId`
5. **View Stats**: User visits stats page → calls `GET /user/stats/:clerkId`

---

## Database Schema

### User
- `id`: String (CUID)
- `clerkId`: String (unique)
- `email`: String (unique)
- `name`: String
- `avatar`: String (optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### QuizAttempt
- `id`: String (CUID)
- `userId`: String (FK → User)
- `topicId`: String (FK → Topic)
- `score`: Int
- `totalQuestions`: Int
- `correctAnswers`: Int
- `percentage`: Float
- `timeSpent`: Int (seconds)
- `difficulty`: String
- `completedAt`: DateTime

**Indexes:**
- `userId` (for fast user lookup)
- `topicId` (for topic-based queries)
- `completedAt` (for chronological sorting)

---

## Notes

- All timestamps are in ISO 8601 format
- ClerkId is required for all user-related endpoints
- Quiz attempts are automatically timestamped on completion
- Frontend handles localStorage backup for offline functionality
- Backend API is stateless (no sessions)
