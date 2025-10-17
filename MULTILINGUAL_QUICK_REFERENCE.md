# 🌍 Multilingual System - Quick Reference Guide

## 🚀 Quick Start

### For Users
1. Navigate to `/quiz/multilingual` or click "Explore Multilingual Quizzes" on home page
2. Select a quiz
3. Choose your preferred language
4. Take the quiz with ability to switch languages anytime

### For Developers
```tsx
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getLocalizedContent } from '@/lib/i18n/utils';

export function MyComponent({ quiz }) {
  const { language, setLanguage } = useLanguage();
  const title = getLocalizedContent(quiz.title, language);
  return <h1>{title}</h1>;
}
```

---

## 📚 Core Files Map

| File | Purpose | Key Exports |
|------|---------|-------------|
| `lib/i18n/config.ts` | Language configuration & metadata | `LANGUAGES`, `LanguageCode`, `detectBrowserLanguage()` |
| `lib/i18n/LanguageContext.tsx` | Global language state | `useLanguage()`, `LanguageProvider` |
| `lib/i18n/utils.ts` | Utilities for localization | `getLocalizedContent()`, `validateMultilingualQuiz()` |
| `src/components/i18n/LanguageSelector.tsx` | Language selection UI | `<LanguageSelector />` |
| `src/components/i18n/LanguageToggle.tsx` | Quick language toggle button | `<LanguageToggle />` |
| `src/components/quiz/MultilingualQuizPage.tsx` | Complete quiz component | `<MultilingualQuizPage />` |
| `lib/data/multilingualQuizzes.ts` | Sample quiz data | `multilingualQuizzes[]` |
| `app/quiz/multilingual/page.tsx` | Quiz selection interface | Page component |

---

## 🎯 Common Tasks

### Display Text in User's Language
```tsx
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getLocalizedContent } from '@/lib/i18n/utils';

const { language } = useLanguage();
const text = getLocalizedContent(multilingualData.title, language);
```

### Display Array (Options) in User's Language
```tsx
import { getLocalizedArray } from '@/lib/i18n/utils';

const options = getLocalizedArray(question.options, language);
// Returns: ['Option A', 'Option B', 'Option C', 'Option D']
```

### Change User Language
```tsx
const { setLanguage } = useLanguage();
setLanguage('hi'); // Switch to Hindi
```

### Validate Multilingual Quiz Data
```tsx
import { validateMultilingualQuiz } from '@/lib/i18n/utils';

const errors = validateMultilingualQuiz(quizData);
if (errors.length > 0) {
  errors.forEach(error => console.error(error));
}
```

### Create CSV Template for Import
```tsx
import { createCSVTemplate } from '@/lib/i18n/utils';

const csv = createCSVTemplate();
// Returns: CSV template with columns for EN, HI, ES, FR
```

### Detect Available Languages in Quiz
```tsx
import { detectAvailableLanguages } from '@/lib/i18n/utils';

const languages = detectAvailableLanguages(quizData);
// Returns: ['en', 'hi', 'es'] (only languages that have content)
```

---

## 🌐 Languages Supported

```
EN (English)    🇺🇸  - Latin script, Inter font
HI (Hindi)      🇮🇳  - Devanagari script, Noto Sans Devanagari font
ES (Spanish)    🇪🇸  - Latin script, Inter font
FR (French)     🇫🇷  - Latin script, Inter font
```

---

## 📝 Multilingual Data Structure

### Single Language String
```typescript
const title: Record<LanguageCode, string> = {
  en: 'India General Knowledge',
  hi: 'भारत सामान्य ज्ञान',
  es: 'Conocimiento General de India',
  fr: 'Connaissances Générales sur l\'Inde'
}
```

### Array (Like Options)
```typescript
const options: Record<LanguageCode, string[]> = {
  en: ['Option A', 'Option B', 'Option C', 'Option D'],
  hi: ['विकल्प ए', 'विकल्प बी', 'विकल्प सी', 'विकल्प डी'],
  es: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
  fr: ['Option A', 'Option B', 'Option C', 'Option D']
}
```

### Question Object
```typescript
interface MultilingualQuestion {
  questionId: string;
  question: Record<LanguageCode, string>;
  options: Record<LanguageCode, string[]>;
  correctAnswer: number;           // Always in same position
  explanation: Record<LanguageCode, string>;
  points: number;
}
```

### Quiz Object
```typescript
interface MultilingualQuiz {
  quizId: string;
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  difficulty: 'easy' | 'medium' | 'hard';
  availableLanguages: LanguageCode[];
  defaultLanguage: LanguageCode;
  timeLimit: number;              // in seconds
  questions: MultilingualQuestion[];
  category?: string;
}
```

---

## 🎨 UI Components

### LanguageSelector
```tsx
<LanguageSelector
  availableLanguages={['en', 'hi', 'es', 'fr']}  // Optional, uses all if omitted
  showLabel={true}                                 // Optional
  compact={false}                                  // Optional: true = dropdown, false = grid
/>
```

**Props:**
- `availableLanguages?` - Limit to specific languages
- `showLabel?` - Show/hide "Choose Your Language" label (default: true)
- `compact?` - Switch between grid and dropdown mode (default: false)

**Behavior:**
- Full mode: 4-column responsive grid
- Compact mode: Dropdown button with menu
- Mobile responsive: Adapts to screen size

### LanguageToggle  
```tsx
<LanguageToggle
  availableLanguages={['en', 'hi', 'es', 'fr']}  // Required
/>
```

**Features:**
- Fixed position floating button (bottom-right)
- Shows current language ↔ next language
- Rotating arrow animation
- Auto-hidden if only 1 language available
- Tooltip on hover

---

## 🔌 Hook: useLanguage()

```tsx
const { language, setLanguage } = useLanguage();

// language: 'en' | 'hi' | 'es' | 'fr'
// setLanguage: (lang: LanguageCode) => void
```

**Initialization:**
1. Checks localStorage for saved preference
2. If not found, detects browser language
3. Falls back to English if detected language not supported
4. Syncs to `document.documentElement.lang` for accessibility
5. Persists any changes to localStorage

---

## 💾 Data Flow

```
User visits app
  ↓
LanguageProvider checks localStorage
  ↓
If found: Load saved preference
If not found: Detect browser language → Save to localStorage
  ↓
useLanguage() hook provides language state
  ↓
Components use getLocalizedContent() to fetch text
  ↓
User selects different language
  ↓
setLanguage() updates state + localStorage + document.lang
  ↓
Components re-render with new language
```

---

## 🧪 Testing Examples

### Test Language Switching
```tsx
export function TestComponent() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div>
      <p>Current: {language}</p>
      <button onClick={() => setLanguage('hi')}>Switch to Hindi</button>
      <button onClick={() => setLanguage('en')}>Switch to English</button>
    </div>
  );
}
```

### Test Localized Content
```tsx
const quiz = multilingualQuizzes[0];
const title_en = getLocalizedContent(quiz.title, 'en');
const title_hi = getLocalizedContent(quiz.title, 'hi');
console.log(title_en, title_hi); // Compare outputs
```

### Test Validation
```tsx
const errors = validateMultilingualQuiz(quizData);
if (errors.length > 0) {
  console.log('Validation failed:');
  errors.forEach(err => console.error(err));
} else {
  console.log('Quiz is valid for all languages');
}
```

---

## 🔗 Route Map

| Route | Purpose |
|-------|---------|
| `/quiz/multilingual` | Quiz selection interface |
| `/quiz/multilingual?quiz=india_gk_001` | (Future) Direct quiz link |
| `/api/quizzes?language=hi` | (Phase 3.7) Get quizzes for language |
| `/admin/quizzes/multilingual` | (Phase 3.4) Admin management |
| `/admin/quizzes/bulk-upload` | (Phase 3.5) Bulk import |

---

## 📊 Sample Data

**2 Quizzes provided:**
1. **India General Knowledge** (5 questions, medium difficulty)
2. **Mathematics Basics** (2 questions, easy difficulty)

**All sample data includes:**
- All 4 languages (EN, HI, ES, FR)
- Complete explanations
- Points system
- Difficulty levels

---

## 🛠️ Configuration

### Add a New Language

**Step 1:** Update `lib/i18n/config.ts`
```typescript
export const LANGUAGES = {
  // ... existing languages
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
    fontClass: 'font-inter'
  }
} as const;
```

**Step 2:** Update UI sample data:
```typescript
const quiz: MultilingualQuiz = {
  title: {
    en: 'Title',
    hi: 'शीर्षक',
    es: 'Título',
    fr: 'Titre',
    de: 'Titel'  // Add German
  },
  // ... rest of fields
}
```

**Step 3:** (Optional) Add font if script differs:
- Add font import to `app/layout.tsx`
- Add CSS variable to `app/globals.css`
- Update `LANGUAGES` with `fontClass`

---

## 🎓 Best Practices

1. ✅ Always use `LanguageProvider` at root level
2. ✅ Use `useLanguage()` hook in components (not manual prop passing)
3. ✅ Prefer `getLocalizedContent()` over manual Record access
4. ✅ Validate multilingual data with `validateMultilingualQuiz()`
5. ✅ Provide fallback content in English
6. ✅ Test with all 4 languages before deploying
7. ✅ Use type-safe `LanguageCode` type, not string literals

**Avoid:**
- ❌ Hardcoding language codes as strings
- ❌ Prop drilling language state through components
- ❌ Mixing translation libraries with custom context
- ❌ Storing language preference only in state (use localStorage)

---

## 🐛 Troubleshooting

**Issue: Language not persisting after refresh**
- Solution: Check localStorage is enabled in browser
- Check: LanguageProvider is wrapping entire app

**Issue: Text appearing in wrong language**
- Check: All languages represented in multilingual object
- Verify: getLocalizedContent() fallback chain
- Test: Browser language detection

**Issue: Hindi text not rendering**
- Check: Noto Sans Devanagari font is loaded
- Verify: CSS class `.font-noto-sans-devanagari` applied
- Test: Font file downloaded from Google Fonts

**Issue: Component not re-rendering on language change**
- Ensure: Using `useLanguage()` hook (not manual state)
- Check: Component is wrapped with LanguageProvider
- Verify: Not using cached values

---

## 📈 Performance Tips

1. **Lazy load fonts** - Google Fonts automatically lazy-loads
2. **Memoize localized content** - Use useMemo for frequently accessed content
3. **Cache quiz data** - Server-side cache all quiz data
4. **Optimize bundle** - i18n code is tree-shakeable
5. **Compress translations** - Gzip works well on repeated translations

---

## 📞 Quick Help

**Need to...**

1. **Show text in current language?**
   ```tsx
   const { language } = useLanguage();
   const text = getLocalizedContent(data, language);
   ```

2. **Let user change language?**
   ```tsx
   <LanguageSelector availableLanguages={['en', 'hi']} />
   ```

3. **Add language toggle during action?**
   ```tsx
   <LanguageToggle availableLanguages={['en', 'hi', 'es', 'fr']} />
   ```

4. **Validate quiz has all languages?**
   ```tsx
   const errors = validateMultilingualQuiz(quiz);
   ```

5. **Create import template?**
   ```tsx
   const csv = createCSVTemplate();
   ```

---

**For More Information:**
- See: `PHASE_3_MULTILINGUAL_IMPLEMENTATION.md` for full documentation
- Code: Check individual component files for JSDoc comments
- Examples: `lib/data/multilingualQuizzes.ts` has sample data

**Last Updated:** January 2025
