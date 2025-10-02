# Quiz App Backend API - Testing Guide

## 🚀 Server Running
Your backend API is running at: **http://localhost:5000**

## 📊 Database Status
- ✅ 2 Subjects created (JavaScript, React)
- ✅ 3 Topics created
- ✅ 20 Questions created

## 📚 Available API Endpoints

### 1. Health Check
```
GET /api/health
```
**Example Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-02T..."
}
```

### 2. Get All Subjects with Topics
```
GET /api/subjects
```
**Example Response:**
```json
[
  {
    "id": "clxxx...",
    "name": "JavaScript",
    "topics": [
      {
        "id": "clyyy...",
        "name": "Fundamentals",
        "_count": { "questions": 10 }
      },
      {
        "id": "clzzz...",
        "name": "ES6 Features",
        "_count": { "questions": 5 }
      }
    ]
  }
]
```

### 3. Get Topic Details
```
GET /api/topics/:topicId
```
**Example:** `GET /api/topics/clyyy...`

**Example Response:**
```json
{
  "id": "clyyy...",
  "name": "Fundamentals",
  "subject": {
    "id": "clxxx...",
    "name": "JavaScript"
  },
  "_count": { "questions": 10 }
}
```

### 4. Start Quiz Session
```
GET /api/quiz/session/:topicId?count=10
```
**Query Parameters:**
- `count` (optional): Number of questions (default: 10)

**Example:** `GET /api/quiz/session/clyyy...?count=5`

**Example Response:**
```json
{
  "topicId": "clyyy...",
  "questions": [
    {
      "id": "q1",
      "text": "What is the correct way to declare a constant?",
      "options": [
        { "id": "a", "text": "var PI = 3.14;" },
        { "id": "b", "text": "let PI = 3.14;" },
        { "id": "c", "text": "const PI = 3.14;" },
        { "id": "d", "text": "constant PI = 3.14;" }
      ]
    }
  ]
}
```

### 5. Submit Quiz
```
POST /api/quiz/submit
Content-Type: application/json
```

**Request Body:**
```json
{
  "topicId": "clyyy...",
  "answers": [
    {
      "questionId": "q1",
      "selectedOptionId": "c"
    },
    {
      "questionId": "q2",
      "selectedOptionId": "b"
    }
  ],
  "timeSpent": 120
}
```

**Example Response:**
```json
{
  "score": 8.75,
  "totalQuestions": 10,
  "correctAnswers": 9,
  "incorrectAnswers": [
    {
      "questionId": "q2",
      "selectedOptionId": "b",
      "correctAnswerId": "a"
    }
  ],
  "percentage": 87.5
}
```

**Scoring System:**
- +1 point for correct answer
- -0.25 point for incorrect answer (negative marking)
- Minimum score: 0

### 6. Get Review Questions
```
POST /api/quiz/review
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionIds": ["q1", "q2", "q3"]
}
```

**Example Response:**
```json
[
  {
    "id": "q1",
    "text": "What is the correct way to declare a constant?",
    "options": [
      { "id": "a", "text": "var PI = 3.14;" },
      { "id": "b", "text": "let PI = 3.14;" },
      { "id": "c", "text": "const PI = 3.14;" },
      { "id": "d", "text": "constant PI = 3.14;" }
    ],
    "correctAnswerId": "c",
    "explanation": "The const keyword is used to declare constants in JavaScript."
  }
]
```

## 🧪 Testing with PowerShell

### Get all subjects:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/subjects" | ConvertTo-Json -Depth 10
```

### Start a quiz session (replace TOPIC_ID):
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/quiz/session/TOPIC_ID?count=5" | ConvertTo-Json -Depth 10
```

### Submit quiz answers:
```powershell
$body = @{
  topicId = "TOPIC_ID"
  answers = @(
    @{ questionId = "Q_ID_1"; selectedOptionId = "a" },
    @{ questionId = "Q_ID_2"; selectedOptionId = "b" }
  )
  timeSpent = 120
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/quiz/submit" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json
```

### Get review questions:
```powershell
$body = @{
  questionIds = @("Q_ID_1", "Q_ID_2")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/quiz/review" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

## 🧪 Testing with cURL

### Get all subjects:
```bash
curl http://localhost:5000/api/subjects
```

### Start a quiz session:
```bash
curl "http://localhost:5000/api/quiz/session/TOPIC_ID?count=5"
```

### Submit quiz:
```bash
curl -X POST http://localhost:5000/api/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "TOPIC_ID",
    "answers": [
      {"questionId": "Q_ID_1", "selectedOptionId": "a"}
    ],
    "timeSpent": 120
  }'
```

## 🏗️ Architecture

```
backend/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── prisma.ts             # Prisma client singleton
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── services/
│   │   └── quiz.service.ts   # Business logic layer
│   ├── controllers/
│   │   └── quiz.controller.ts # Request/response handlers
│   └── routes/
│       ├── index.ts          # Route aggregator
│       └── quiz.routes.ts    # Quiz-specific routes
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data script
└── package.json
```

## 🎯 Features Implemented

✅ **Layered Architecture**
  - Routes → Controllers → Services → Database

✅ **Type Safety**
  - Full TypeScript support
  - Custom type definitions

✅ **Quiz Features**
  - Random question selection
  - Option shuffling (prevents answer memorization)
  - Negative marking (-0.25 for wrong answers)
  - Score calculation with percentage
  - Question review with explanations

✅ **Database**
  - PostgreSQL with Prisma ORM
  - Proper relationships (Subject → Topic → Question)
  - 20 sample questions across 2 subjects

✅ **Error Handling**
  - Comprehensive error messages
  - 404 for missing resources
  - 400 for invalid requests
  - 500 for server errors

## 🔄 Reseed Database

To reset and reseed the database:
```bash
cd backend
npm run seed
```

## 📝 npm Scripts

```bash
npm run dev    # Start development server (nodemon + tsx)
npm run build  # Compile TypeScript to JavaScript
npm run start  # Run compiled JavaScript
npm run seed   # Seed database with sample data
```

## 🚀 Next Steps

The backend is complete! You can now:

1. **Test all endpoints** using the browser or Postman
2. **Build the frontend** with Next.js to consume these APIs
3. **Add authentication** (optional, for user accounts)
4. **Deploy to production** (Vercel, Railway, etc.)

Happy coding! 🎉
