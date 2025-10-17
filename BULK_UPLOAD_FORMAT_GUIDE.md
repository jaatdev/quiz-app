# Bulk Upload Format Guide - Quick Reference

## Overview
Use this guide to understand the CSV and JSON formats for bulk uploading multilingual quizzes.

---

## CSV Format

### Header Row
```
Title (EN),Title (HI),Title (ES),Title (FR),Description (EN),Description (HI),Description (ES),Description (FR),Category,Difficulty,Time Limit (mins),Q1 Text (EN),Q1 Text (HI),Q1 Text (ES),Q1 Text (FR),Q1 Option 1 (EN),Q1 Option 2 (EN),Q1 Option 3 (EN),Q1 Option 4 (EN),Q1 Correct Answer (1-4),Q1 Explanation (EN)...
```

### Example Row
```csv
"Indian Independence","भारतीय स्वतंत्रता","Independencia India","Indépendance Indienne","Test your knowledge about Indian independence","भारतीय स्वतंत्रता के बारे में अपने ज्ञान का परीक्षण करें","Prueba tus conocimientos sobre la independencia india","Testez vos connaissances sur l'indépendance indienne","History","medium","5","Who is the father of the Indian nation?","भारतीय राष्ट्र के पिता कौन हैं?","¿Quién es el padre de la nación india?","Qui est le père de la nation indienne?","Jawaharlal Nehru","Mahatma Gandhi","Sardar Patel","Bhagat Singh","2","Mahatma Gandhi led the independence movement and is revered as the father of the Indian nation."
```

### CSV Field Breakdown
| Column | Type | Required | Example | Notes |
|--------|------|----------|---------|-------|
| Title (EN) | Text | Yes | "Indian Independence" | English title |
| Title (HI) | Text | Yes | "भारतीय स्वतंत्रता" | Hindi title |
| Title (ES) | Text | Yes | "Independencia India" | Spanish title |
| Title (FR) | Text | Yes | "Indépendance Indienne" | French title |
| Description (EN) | Text | Yes | "Test your..." | English description |
| Description (HI) | Text | Yes | "भारतीय स्वतंत्रता..." | Hindi description |
| Description (ES) | Text | Yes | "Prueba tus..." | Spanish description |
| Description (FR) | Text | Yes | "Testez vos..." | French description |
| Category | Text | Yes | "History" | Category of quiz |
| Difficulty | Text | Yes | "easy\|medium\|hard" | Difficulty level |
| Time Limit | Number | Yes | 5 | Time in minutes |
| Q1 Text (EN) | Text | Yes | "Who is...?" | Question text in English |
| Q1 Text (HI) | Text | Yes | "कौन है...?" | Question text in Hindi |
| Q1 Text (ES) | Text | Yes | "¿Quién es...?" | Question text in Spanish |
| Q1 Text (FR) | Text | Yes | "Qui est...?" | Question text in French |
| Q1 Option 1 (EN) | Text | Yes | "Option A" | First choice (English) |
| Q1 Option 2 (EN) | Text | Yes | "Option B" | Second choice (English) |
| Q1 Option 3 (EN) | Text | Yes | "Option C" | Third choice (English) |
| Q1 Option 4 (EN) | Text | Yes | "Option D" | Fourth choice (English) |
| Q1 Correct Answer | Number | Yes | 2 | 1-4 (index of correct option) |
| Q1 Explanation (EN) | Text | Yes | "Because..." | Explanation in English |

### CSV Quirks
- ✅ Wrap all text in quotes: `"text"`
- ✅ Handle commas inside quotes: `"text, with, commas"`
- ✅ Escape quotes: `"text with \"quotes\""`
- ✅ Use `\n` for line breaks in cells
- ✅ Each row = one quiz (extend columns for Q2, Q3, etc.)

---

## JSON Format

### Top-Level Structure
```json
{
  "quizzes": [ ... array of quiz objects ... ]
}
```

### Complete Example
```json
{
  "quizzes": [
    {
      "title": {
        "en": "Indian Independence",
        "hi": "भारतीय स्वतंत्रता",
        "es": "Independencia India",
        "fr": "Indépendance Indienne"
      },
      "description": {
        "en": "Test your knowledge about Indian independence",
        "hi": "भारतीय स्वतंत्रता के बारे में अपने ज्ञान का परीक्षण करें",
        "es": "Prueba tus conocimientos sobre la independencia india",
        "fr": "Testez vos connaissances sur l'indépendance indienne"
      },
      "category": "History",
      "difficulty": "medium",
      "timeLimit": 5,
      "questions": [
        {
          "questionId": "q1",
          "question": {
            "en": "Who is the father of the Indian nation?",
            "hi": "भारतीय राष्ट्र के पिता कौन हैं?",
            "es": "¿Quién es el padre de la nación india?",
            "fr": "Qui est le père de la nation indienne?"
          },
          "options": {
            "en": [
              "Jawaharlal Nehru",
              "Mahatma Gandhi",
              "Sardar Patel",
              "Bhagat Singh"
            ],
            "hi": [
              "जवाहरलाल नेहरू",
              "महात्मा गांधी",
              "सरदार पटेल",
              "भगत सिंह"
            ],
            "es": [
              "Jawaharlal Nehru",
              "Mahatma Gandhi",
              "Sardar Patel",
              "Bhagat Singh"
            ],
            "fr": [
              "Jawaharlal Nehru",
              "Mahatma Gandhi",
              "Sardar Patel",
              "Bhagat Singh"
            ]
          },
          "correctAnswer": 1,
          "explanation": {
            "en": "Mahatma Gandhi led the independence movement and is revered as the father of the Indian nation.",
            "hi": "महात्मा गांधी ने स्वतंत्रता आंदोलन का नेतृत्व किया और उन्हें भारतीय राष्ट्र के पिता के रूप में पूजा जाता है।",
            "es": "Mahatma Gandhi encabezó el movimiento de independencia y es venerado como el padre de la nación india.",
            "fr": "Mahatma Gandhi a dirigé le mouvement d'indépendance et est vénéré comme le père de la nation indienne."
          },
          "points": 10
        }
      ]
    }
  ]
}
```

### JSON Field Reference

#### Quiz Object
```json
{
  "title": { "en": "...", "hi": "...", "es": "...", "fr": "..." },
  "description": { "en": "...", "hi": "...", "es": "...", "fr": "..." },
  "category": "string",
  "difficulty": "easy|medium|hard",
  "timeLimit": number,
  "questions": [ ... ]
}
```

#### Question Object
```json
{
  "questionId": "string (unique per quiz, e.g., 'q1', 'q2')",
  "question": { "en": "...", "hi": "...", "es": "...", "fr": "..." },
  "options": {
    "en": ["option1", "option2", "option3", "option4"],
    "hi": ["विकल्प1", "विकल्प2", "विकल्प3", "विकल्प4"],
    "es": ["opción1", "opción2", "opción3", "opción4"],
    "fr": ["option1", "option2", "option3", "option4"]
  },
  "correctAnswer": 0|1|2|3,
  "explanation": { "en": "...", "hi": "...", "es": "...", "fr": "..." },
  "points": number (default 10)
}
```

---

## Requirements & Validation

### Required Fields
- ✅ Quiz: title (all 4 languages), description (all 4 languages), category, difficulty, timeLimit
- ✅ Question: questionId (unique), question (all 4 languages), options (all 4 languages), correctAnswer, explanation (all 4 languages), points

### Validation Rules
| Field | Rule | Example |
|-------|------|---------|
| title | Not empty, all 4 languages | "English Title" + Hindi + Spanish + French |
| description | Not empty, all 4 languages | At least 10 characters recommended |
| category | Not empty | "History", "Science", "Math", etc. |
| difficulty | Must be: easy, medium, hard | "medium" |
| timeLimit | Positive number | 5, 10, 15, etc. |
| questionId | Unique per quiz | "q1", "q2", "question_1", etc. |
| options | Exactly 4 options per language | ["A", "B", "C", "D"] |
| correctAnswer | 0-3 (zero-indexed) | 0 = first option, 3 = last option |
| explanation | Not empty, all 4 languages | Helpful explanation why answer is correct |
| points | Positive number | 10, 20, 50, etc. |

### Language Codes
| Code | Language | Notes |
|------|----------|-------|
| en | English 🇺🇸 | American English |
| hi | Hindi 🇮🇳 | Devanagari script |
| es | Spanish 🇪🇸 | Castilian Spanish |
| fr | French 🇫🇷 | Standard French |

---

## Error Messages & Fixes

### Common Errors

#### ❌ "Quiz title is required"
- **Cause:** Title missing for one or more languages
- **Fix:** Ensure all 4 language titles are provided

#### ❌ "Missing required language: hindi"
- **Cause:** Hindi (hi) content is empty or missing
- **Fix:** Provide content for all 4 languages (en, hi, es, fr)

#### ❌ "Invalid difficulty: 'Hard'"
- **Cause:** Difficulty must be lowercase
- **Fix:** Use "easy", "medium", or "hard" (lowercase)

#### ❌ "Question must have 4 options"
- **Cause:** Fewer than 4 options provided
- **Fix:** Always provide exactly 4 options per language

#### ❌ "Correct answer must be 0-3"
- **Cause:** Index out of range
- **Fix:** Use 0 (first), 1 (second), 2 (third), or 3 (fourth)

#### ❌ "CSV parsing failed: invalid format"
- **Cause:** CSV syntax error or missing quotes
- **Fix:** Download template and follow structure exactly

#### ❌ "JSON parsing failed"
- **Cause:** Invalid JSON syntax
- **Fix:** Use online JSON validator (jsonlint.com)

---

## Tips & Best Practices

### Do's ✅
- Always provide content for all 4 languages
- Use proper formatting (quotes in CSV, nested objects in JSON)
- Test with 1-2 quizzes first before bulk import
- Download template to see correct format
- Review preview before confirming import
- Use meaningful questionIds (q1, q2, introduction, etc.)
- Provide clear, helpful explanations

### Don'ts ❌
- Don't leave any language fields empty
- Don't use invalid difficulty values
- Don't provide fewer than 4 options
- Don't mix CSV and JSON in one upload
- Don't forget to quote CSV text values
- Don't use newlines in CSV without proper escaping
- Don't provide more than 50-100 quizzes in one file (upload in batches)

### Performance Tips
- 📊 Recommended quiz size per upload: 1-50 quizzes
- 💾 File size limit: Depends on browser, typically 100MB+
- ⚡ Parsing time: ~1-5 seconds for typical uploads
- 🔄 Validation time: ~1-2 seconds per quiz

---

## Upload Process Flowchart

```
START
  ↓
Select Upload Method (CSV/JSON)
  ↓
Download Template (optional)
  ↓
Upload File (drag-drop or browse)
  ↓
System Parses File
  ├─ Success → Preview shown
  └─ Error → Error message displayed
  ↓
Review Quizzes in Preview
  ├─ Can expand each quiz
  ├─ Can select languages to import
  └─ Can return to upload new file
  ↓
Click "Import" Button
  ↓
System Validates Each Quiz
  ├─ Valid → Added to success count ✅
  └─ Invalid → Error details shown ❌
  ↓
Import Complete
  ├─ Success: Show summary and recently imported list
  └─ Partial: Show errors for failed quizzes
  ↓
END
```

---

## Support & Questions

For detailed information, see:
- **PHASE_3_5_BULK_UPLOAD_COMPLETE.md** - Implementation details
- **MULTILINGUAL_QUICK_REFERENCE.md** - API and component reference
- **PHASE_3_CONTINUATION_GUIDE.md** - Next phases roadmap

Download templates from the upload page to see exact format!
