# Multilingual Quiz API Reference

Complete API documentation for multilingual quiz endpoints.

**Base URL:** `http://localhost:3001/api` (development)

---

## Table of Contents
1. [Quizzes](#quizzes)
2. [Quiz Attempts](#quiz-attempts)
3. [User Statistics](#user-statistics)
4. [Error Codes](#error-codes)

---

## Quizzes

### List Quizzes

```
GET /quizzes/multilingual
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Filter by category |
| `difficulty` | string | - | Filter: easy, medium, hard |
| `language` | string | en | Content language code |
| `search` | string | - | Search in title/description |
| `limit` | number | 10 | Results per page |
| `offset` | number | 0 | Pagination offset |

**Example:**
```bash
GET /quizzes/multilingual?category=History&difficulty=medium&language=hi&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clq123...",
      "title": {
        "en": "India General Knowledge",
        "hi": "भारत सामान्य ज्ञान",
        "es": "Conocimiento General de India",
        "fr": "Connaissances Générales sur l'Inde"
      },
      "description": {
        "en": "Test your knowledge about India...",
        "hi": "भारत के बारे में अपने ज्ञान का परीक्षण करें...",
        "es": "Prueba tus conocimientos sobre India...",
        "fr": "Testez vos connaissances sur l'Inde..."
      },
      "category": "Geography",
      "difficulty": "medium",
      "timeLimit": 10,
      "availableLanguages": ["en", "hi", "es", "fr"],
      "defaultLanguage": "en",
      "createdAt": "2024-10-17T10:00:00Z",
      "questions": [
        {
          "id": "q1",
          "sequenceNumber": 1,
          "points": 10
        }
      ]
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Get Quiz

```
GET /quizzes/multilingual/:quizId
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | string | Quiz ID (required) |

**Example:**
```bash
GET /quizzes/multilingual/clq123abc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clq123",
    "title": {
      "en": "India General Knowledge",
      "hi": "भारत सामान्य ज्ञान",
      "es": "Conocimiento General de India",
      "fr": "Connaissances Générales sur l'Inde"
    },
    "description": { ... },
    "category": "Geography",
    "difficulty": "medium",
    "timeLimit": 10,
    "availableLanguages": ["en", "hi", "es", "fr"],
    "defaultLanguage": "en",
    "tags": ["india", "general-knowledge", "geography"],
    "createdBy": "admin_user_id",
    "createdAt": "2024-10-17T10:00:00Z",
    "updatedAt": "2024-10-17T10:00:00Z",
    "questions": [
      {
        "id": "q1",
        "quizId": "clq123",
        "question": {
          "en": "What is the capital of India?",
          "hi": "भारत की राजधानी क्या है?",
          "es": "¿Cuál es la capital de India?",
          "fr": "Quelle est la capitale de l'Inde?"
        },
        "options": {
          "en": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
          "hi": ["मुंबई", "नई दिल्ली", "कोलकाता", "चेन्नई"],
          "es": ["Bombay", "Nueva Delhi", "Calcuta", "Chennai"],
          "fr": ["Bombay", "Nouvelle Delhi", "Calcutta", "Chennai"]
        },
        "correctAnswer": 1,
        "explanation": {
          "en": "New Delhi has been the capital of India since 1911.",
          "hi": "नई दिल्ली 1911 से भारत की राजधानी है।",
          "es": "Nueva Delhi ha sido la capital de India desde 1911.",
          "fr": "Nouvelle Delhi est la capitale de l'Inde depuis 1911."
        },
        "points": 10,
        "category": "Geography",
        "sequenceNumber": 1
      },
      // More questions...
    ]
  }
}
```

---

### Create Quiz

```
POST /quizzes/multilingual
```

**Authentication:** Required (Admin only)

**Headers:**
```
x-clerk-user-id: <user_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": {
    "en": "New Quiz",
    "hi": "नई क्विज़",
    "es": "Nuevo Quiz",
    "fr": "Nouveau Quiz"
  },
  "description": {
    "en": "Quiz description...",
    "hi": "क्विज़ विवरण...",
    "es": "Descripción del quiz...",
    "fr": "Description du quiz..."
  },
  "category": "Science",
  "difficulty": "hard",
  "timeLimit": 15,
  "questions": [
    {
      "question": {
        "en": "What is H2O?",
        "hi": "H2O क्या है?",
        "es": "¿Qué es H2O?",
        "fr": "Qu'est-ce que H2O?"
      },
      "options": {
        "en": ["Salt", "Water", "Sugar", "Oil"],
        "hi": ["नमक", "पानी", "चीनी", "तेल"],
        "es": ["Sal", "Agua", "Azúcar", "Aceite"],
        "fr": ["Sel", "Eau", "Sucre", "Huile"]
      },
      "correctAnswer": 1,
      "explanation": {
        "en": "H2O is the chemical formula for water.",
        "hi": "H2O पानी का रासायनिक सूत्र है।",
        "es": "H2O es la fórmula química del agua.",
        "fr": "H2O est la formule chimique de l'eau."
      },
      "points": 10,
      "category": "Chemistry"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "clq456",
    "title": { ... },
    "description": { ... },
    "category": "Science",
    "difficulty": "hard",
    "timeLimit": 15,
    "availableLanguages": ["en", "hi", "es", "fr"],
    "defaultLanguage": "en",
    "questions": [ ... ],
    "createdAt": "2024-10-17T11:00:00Z"
  },
  "message": "Quiz created successfully"
}
```

---

### Update Quiz

```
PUT /quizzes/multilingual/:quizId
```

**Authentication:** Required (Admin only)

**Headers:**
```
x-clerk-user-id: <user_id>
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "title": { ... },
  "description": { ... },
  "category": "Science",
  "difficulty": "medium",
  "timeLimit": 20,
  "questions": [ ... ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Quiz updated successfully"
}
```

---

### Delete Quiz

```
DELETE /quizzes/multilingual/:quizId
```

**Authentication:** Required (Admin only)

**Headers:**
```
x-clerk-user-id: <user_id>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quiz deleted successfully"
}
```

**Note:** Cascades delete all questions and attempts for this quiz.

---

## Quiz Attempts

### Submit Quiz Attempt

```
POST /quizzes/multilingual/:quizId/attempt
```

**Authentication:** Required

**Headers:**
```
x-clerk-user-id: <user_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "languageCode": "en",
  "userAnswers": {
    "q1": 1,
    "q2": 0,
    "q3": 2,
    "q4": 3,
    "q5": 1
  },
  "timeSpent": 245
}
```

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `languageCode` | string | Language code: en, hi, es, fr |
| `userAnswers` | object | Map of questionId → answer (0-3) |
| `timeSpent` | number | Time in seconds |

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt_123",
    "score": 40,
    "correctAnswers": 4,
    "totalQuestions": 5,
    "percentage": 80,
    "timeSpent": 245
  },
  "message": "Quiz attempt submitted successfully"
}
```

---

### Get Quiz Attempts

```
GET /quizzes/multilingual/:quizId/attempts
```

**Authentication:** Required

**Headers:**
```
x-clerk-user-id: <user_id>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Results per page |
| `offset` | number | 0 | Pagination offset |

**Example:**
```bash
GET /quizzes/multilingual/clq123/attempts?limit=10&offset=0
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "attempt_1",
      "userId": "user_123",
      "quizId": "clq123",
      "languageCode": "en",
      "score": 40,
      "totalQuestions": 5,
      "correctAnswers": 4,
      "percentage": 80,
      "timeSpent": 245,
      "userAnswers": {
        "q1": 1,
        "q2": 0,
        "q3": 2,
        "q4": 3,
        "q5": 1
      },
      "completedAt": "2024-10-17T11:15:00Z"
    },
    {
      "id": "attempt_2",
      "userId": "user_123",
      "quizId": "clq123",
      "languageCode": "hi",
      "score": 35,
      "totalQuestions": 5,
      "correctAnswers": 3.5,
      "percentage": 70,
      "timeSpent": 310,
      "completedAt": "2024-10-16T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

---

## User Statistics

### Get Multilingual Stats

```
GET /user/multilingual-stats
```

**Authentication:** Required

**Headers:**
```
x-clerk-user-id: <user_id>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalAttempts": 15,
    "averagePercentage": 78,
    "byLanguage": [
      {
        "language": "en",
        "attempts": 5,
        "averagePercentage": 85,
        "averageTime": 240,
        "totalScore": 95
      },
      {
        "language": "hi",
        "attempts": 4,
        "averagePercentage": 75,
        "averageTime": 280,
        "totalScore": 80
      },
      {
        "language": "es",
        "attempts": 3,
        "averagePercentage": 70,
        "averageTime": 300,
        "totalScore": 65
      },
      {
        "language": "fr",
        "attempts": 3,
        "averagePercentage": 72,
        "averageTime": 290,
        "totalScore": 70
      }
    ]
  }
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Missing required fields | Check request body |
| 401 | Authentication required | Add x-clerk-user-id header |
| 403 | Only admins can... | User must be admin for this operation |
| 404 | Quiz not found | Quiz ID doesn't exist |
| 404 | User not found | User doesn't exist |
| 500 | Failed to... | Server error, check logs |

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Common Use Cases

### Use Case 1: Browse and Filter Quizzes
```bash
# Get all history quizzes in difficulty order
GET /quizzes/multilingual?category=History&difficulty=medium&language=en&limit=10

# Search for specific quiz
GET /quizzes/multilingual?search=independence&language=hi
```

### Use Case 2: Take a Quiz
```bash
# 1. Get quiz details
GET /quizzes/multilingual/clq123

# 2. User answers questions...

# 3. Submit answers
POST /quizzes/multilingual/clq123/attempt
Body: {
  "languageCode": "en",
  "userAnswers": { "q1": 1, "q2": 2, ... },
  "timeSpent": 300
}
```

### Use Case 3: View Quiz History
```bash
# Get all user's attempts for a quiz
GET /quizzes/multilingual/clq123/attempts?limit=20

# Get user's overall stats
GET /user/multilingual-stats
```

### Use Case 4: Admin Create Quiz
```bash
# Requires admin authentication
POST /quizzes/multilingual
Headers: x-clerk-user-id: admin_user_123
Body: { quiz data }
```

### Use Case 5: Admin Update Quiz
```bash
# Update specific quiz
PUT /quizzes/multilingual/clq123
Headers: x-clerk-user-id: admin_user_123
Body: { updated fields }
```

---

## Rate Limiting

(Recommended for production)
- 100 requests per minute per user
- 1000 requests per minute per IP

---

## Pagination

All list endpoints support pagination:

```json
"pagination": {
  "total": 100,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

Use `hasMore` to determine if more results available.

---

## Language Codes

| Code | Language | Locale |
|------|----------|--------|
| `en` | English | 🇺🇸 |
| `hi` | Hindi | 🇮🇳 |
| `es` | Spanish | 🇪🇸 |
| `fr` | French | 🇫🇷 |

---

## Data Types

### LanguageCode
```
"en" | "hi" | "es" | "fr"
```

### Difficulty
```
"easy" | "medium" | "hard"
```

### Quiz
```typescript
{
  id: string;
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  category: string;
  difficulty: string;
  timeLimit: number; // minutes
  availableLanguages: LanguageCode[];
  defaultLanguage: LanguageCode;
  tags: string[];
  createdBy?: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
  questions: Question[];
}
```

### Question
```typescript
{
  id: string;
  quizId: string;
  question: Record<LanguageCode, string>;
  options: Record<LanguageCode, string[]>;
  correctAnswer: number; // 0-3
  explanation: Record<LanguageCode, string>;
  points: number;
  category?: string;
  sequenceNumber: number;
}
```

### QuizAttempt
```typescript
{
  id: string;
  userId: string;
  quizId: string;
  languageCode: LanguageCode;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent: number; // seconds
  userAnswers: Record<string, number>;
  completedAt: ISO8601;
}
```

---

## Testing with cURL

```bash
# List quizzes
curl -X GET "http://localhost:3001/api/quizzes/multilingual"

# Get specific quiz
curl -X GET "http://localhost:3001/api/quizzes/multilingual/[quizId]"

# Submit attempt
curl -X POST "http://localhost:3001/api/quizzes/multilingual/[quizId]/attempt" \
  -H "x-clerk-user-id: user_123" \
  -H "Content-Type: application/json" \
  -d '{
    "languageCode": "en",
    "userAnswers": {"q1": 0, "q2": 1},
    "timeSpent": 180
  }'

# Get user stats
curl -X GET "http://localhost:3001/api/user/multilingual-stats" \
  -H "x-clerk-user-id: user_123"
```

---

## Support & Documentation

- **Implementation:** See `PHASE_3_6_DATABASE_API_COMPLETE.md`
- **Bulk Upload:** See `BULK_UPLOAD_FORMAT_GUIDE.md`
- **Quick Start:** Use this guide with examples above

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-10-17 | Initial release with 8 endpoints |

---

Last Updated: October 17, 2024
