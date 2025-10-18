'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, AlertCircle, CheckCircle, X, ChevronDown } from 'lucide-react';
import { LANGUAGES } from '@/lib/i18n/config';
import { validateMultilingualQuiz, type ValidationError } from '@/lib/i18n/utils';
import type { MultilingualQuiz } from '@/lib/data/multilingualQuizzes';
import type { LanguageCode } from '@/lib/i18n/config';

interface ParsedQuestion {
  questionId: string;
  question: Record<LanguageCode, string>;
  options: Record<LanguageCode, string[]>;
  correctAnswer: number;
  explanation: Record<LanguageCode, string>;
  points: number;
  category?: string;
}

interface ParsedQuiz {
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  questions: ParsedQuestion[];
}

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    quiz: string;
    issues: ValidationError[];
  }>;
}

const BulkUploadComponent: React.FC<{
  onQuizzesImported: (quizzes: MultilingualQuiz[]) => void;
}> = ({ onQuizzesImported }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMethod, setUploadMethod] = useState<'csv' | 'json'>('csv');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedQuiz[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageCode[]>(['en', 'hi', 'es', 'fr']);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);

  // Download CSV Template
  const downloadCSVTemplate = () => {
    const headers = [
      'Title (EN)',
      'Title (HI)',
      'Title (ES)',
      'Title (FR)',
      'Description (EN)',
      'Description (HI)',
      'Description (ES)',
      'Description (FR)',
      'Category',
      'Difficulty',
      'Time Limit (mins)',
      'Q1 Text (EN)',
      'Q1 Text (HI)',
      'Q1 Text (ES)',
      'Q1 Text (FR)',
      'Q1 Option 1 (EN)',
      'Q1 Option 2 (EN)',
      'Q1 Option 3 (EN)',
      'Q1 Option 4 (EN)',
      'Q1 Correct Answer (1-4)',
      'Q1 Explanation (EN)',
      // Additional questions follow the same pattern
    ];

    const sampleData = [
      [
        'Indian Independence',
        'भारतीय स्वतंत्रता',
        'Independencia India',
        'Indépendance Indienne',
        'Test your knowledge about Indian independence',
        'भारतीय स्वतंत्रता के बारे में अपने ज्ञान का परीक्षण करें',
        'Prueba tus conocimientos sobre la independencia india',
        'Testez vos connaissances sur l\'indépendance indienne',
        'History',
        'medium',
        '5',
        'Who is the father of the Indian nation?',
        'भारतीय राष्ट्र के पिता कौन हैं?',
        '¿Quién es el padre de la nación india?',
        'Qui est le père de la nation indienne?',
        'Jawaharlal Nehru',
        'Mahatma Gandhi',
        'Sardar Patel',
        'Bhagat Singh',
        '2',
        'Mahatma Gandhi led the independence movement and is revered as the father of the Indian nation.',
      ],
    ];

    const csv = [
      headers.join(','),
      ...sampleData.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multilingual_quizzes_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download JSON Template
  const downloadJSONTemplate = () => {
    const template = {
      quizzes: [
        {
          title: {
            en: 'Indian Independence',
            hi: 'भारतीय स्वतंत्रता',
            es: 'Independencia India',
            fr: 'Indépendance Indienne',
          },
          description: {
            en: 'Test your knowledge about Indian independence',
            hi: 'भारतीय स्वतंत्रता के बारे में अपने ज्ञान का परीक्षण करें',
            es: 'Prueba tus conocimientos sobre la independencia india',
            fr: 'Testez vos connaissances sur l\'indépendance indienne',
          },
          category: 'History',
          difficulty: 'medium',
          timeLimit: 5,
          questions: [
            {
              text: {
                en: 'Who is the father of the Indian nation?',
                hi: 'भारतीय राष्ट्र के पिता कौन हैं?',
                es: '¿Quién es el padre de la nación india?',
                fr: 'Qui est le père de la nation indienne?',
              },
              options: {
                en: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Sardar Patel', 'Bhagat Singh'],
                hi: ['जवाहरलाल नेहरू', 'महात्मा गांधी', 'सरदार पटेल', 'भगत सिंह'],
                es: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Sardar Patel', 'Bhagat Singh'],
                fr: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Sardar Patel', 'Bhagat Singh'],
              },
              correctAnswer: {
                en: 2,
                hi: 2,
                es: 2,
                fr: 2,
              },
              explanation: {
                en: 'Mahatma Gandhi led the independence movement and is revered as the father of the Indian nation.',
                hi: 'महात्मा गांधी ने स्वतंत्रता आंदोलन का नेतृत्व किया और उन्हें भारतीय राष्ट्र के पिता के रूप में पूजा जाता है।',
                es: 'Mahatma Gandhi encabezó el movimiento de independencia y es venerado como el padre de la nación india.',
                fr: 'Mahatma Gandhi a dirigé le mouvement d\'indépendance et est vénéré comme le père de la nation indienne.',
              },
            },
          ],
        },
      ],
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multilingual_quizzes_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parse CSV File
  const parseCSV = (content: string): ParsedQuiz[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV file is empty');

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const quizzes: ParsedQuiz[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 11) continue; // Skip incomplete rows

      const quiz: ParsedQuiz = {
        title: {
          en: values[0] || '',
          hi: values[1] || '',
          es: values[2] || '',
          fr: values[3] || '',
        },
        description: {
          en: values[4] || '',
          hi: values[5] || '',
          es: values[6] || '',
          fr: values[7] || '',
        },
        category: values[8] || 'General',
        difficulty: (values[9] || 'medium') as 'easy' | 'medium' | 'hard',
        timeLimit: parseInt(values[10] || '5', 10),
        questions: [],
      };

      quizzes.push(quiz);
    }

    return quizzes;
  };

  // Parse JSON File
  const parseJSON = (content: string): ParsedQuiz[] => {
    const data = JSON.parse(content);
    if (!Array.isArray(data.quizzes)) {
      throw new Error('JSON must contain "quizzes" array');
    }
    return data.quizzes;
  };

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const content = await file.text();

      let parsed: ParsedQuiz[] = [];
      if (uploadMethod === 'csv') {
        parsed = parseCSV(content);
      } else {
        parsed = parseJSON(content);
      }

      if (parsed.length === 0) {
        throw new Error('No valid quizzes found in file');
      }

      setPreviewData(parsed);
    } catch (error) {
      alert(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate and Import Quizzes
  const handleImport = async () => {
    try {
      setIsProcessing(true);
      const result: UploadResult = {
        total: previewData.length,
        successful: 0,
        failed: 0,
        errors: [],
      };

      const validQuizzes: MultilingualQuiz[] = [];

      previewData.forEach((quiz, index) => {
        const multilingualQuiz: MultilingualQuiz = {
          quizId: `quiz_${Date.now()}_${index}`,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          timeLimit: quiz.timeLimit,
          availableLanguages: ['en', 'hi', 'es', 'fr'],
          defaultLanguage: 'en',
          questions: quiz.questions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const validation = validateMultilingualQuiz(multilingualQuiz);
        if (validation.isValid) {
          validQuizzes.push(multilingualQuiz);
          result.successful++;
        } else {
          result.failed++;
          result.errors.push({
            row: index + 2,
            quiz: quiz.title.en || 'Untitled',
            issues: validation.errors,
          });
        }
      });

      setUploadResult(result);

      if (validQuizzes.length > 0) {
        onQuizzesImported(validQuizzes);
        setPreviewData([]);
      }
    } catch (error) {
      alert(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Upload
  const handleReset = () => {
    setPreviewData([]);
    setUploadResult(null);
    setExpandedQuiz(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Bulk Upload Multilingual Quizzes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Import multiple quizzes in different languages using CSV or JSON format
        </p>
      </motion.div>

      {/* Upload Method Selection */}
      {previewData.length === 0 && !uploadResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
            {(['csv', 'json'] as const).map((method) => (
            <motion.button
              key={method}
              onClick={() => setUploadMethod(method)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                uploadMethod === method
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-semibold text-lg mb-2">
                {method === 'csv' ? '📄 CSV Format' : '🔷 JSON Format'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {method === 'csv'
                  ? 'Upload comma-separated values file'
                  : 'Upload JSON structured data'}
              </p>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Template Download */}
      {previewData.length === 0 && !uploadResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-4"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Get Started with Templates
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              Download a template to see the expected format for your file:
            </p>
            <div className="flex gap-2 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadCSVTemplate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV Template
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadJSONTemplate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                JSON Template
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* File Upload Area */}
      {previewData.length === 0 && !uploadResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={uploadMethod === 'csv' ? '.csv' : '.json'}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          <motion.div
            animate={{ scale: isDragging ? 1.1 : 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                or click to browse
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : `Select ${uploadMethod.toUpperCase()} File`}
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Preview Data */}
      <AnimatePresence>
        {previewData.length > 0 && !uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Preview ({previewData.length} quizzes)</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Change File
              </motion.button>
            </div>

            {/* Language Filter */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Languages to Import:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <motion.button
                    key={code}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSelectedLanguages((prev) =>
                        prev.includes(code as LanguageCode)
                          ? prev.filter((l) => l !== code)
                          : [...prev, code as LanguageCode]
                      )
                    }
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      selectedLanguages.includes(code as LanguageCode)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {lang.flag} {lang.nativeName}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quiz List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {previewData.map((quiz, index) => (
                <motion.div
                  key={`preview-quiz-${index}-${quiz?.title?.en?.slice(0,10) ?? 'untitled'}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <motion.button
                    onClick={() =>
                      setExpandedQuiz(expandedQuiz === index ? null : index)
                    }
                    className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {quiz.title.en || 'Untitled'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {quiz.questions.length} questions • {quiz.category} • {quiz.difficulty}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedQuiz === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  </motion.button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedQuiz === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 space-y-3"
                      >
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                            Description
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {quiz.description.en}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <span className="font-semibold">Category:</span> {quiz.category}
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <span className="font-semibold">Time:</span> {quiz.timeLimit} mins
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded">
                            <span className="font-semibold">Q:</span> {quiz.questions.length}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Import Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleImport}
              disabled={isProcessing}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Importing...' : `Import ${previewData.length} Quizzes`}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Result */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Summary */}
            <motion.div
              className={`p-6 rounded-xl border-2 ${
                uploadResult.failed === 0
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-start gap-4">
                {uploadResult.failed === 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    {uploadResult.failed === 0 ? 'Import Successful!' : 'Import Completed with Issues'}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-semibold">Total</p>
                      <p className="text-2xl font-bold">{uploadResult.total}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">Successful</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {uploadResult.successful}
                      </p>
                    </div>
                    {uploadResult.failed > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">Failed</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {uploadResult.failed}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Error Details */}
            {uploadResult.errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <h3 className="font-bold">Issues Found:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {uploadResult.errors.map((error, idx) => (
                    <motion.div
                      key={`upload-error-${error.row}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3"
                    >
                      <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        Row {error.row}: {error.quiz}
                      </p>
                      <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                        {error.issues.map((issue, i) => (
                          <li key={`issue-${error.row}-${i}`} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{issue.field}: {issue.message}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold transition-colors"
              >
                Upload Another File
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setUploadResult(null);
                  setPreviewData([]);
                }}
                className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkUploadComponent;
