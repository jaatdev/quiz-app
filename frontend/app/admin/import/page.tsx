'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileJson, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/config';

interface ImportResult {
  success: boolean;
  created?: number;
  message: string;
}

export default function BulkImportPage() {
  const { user } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'json' | 'csv'>('json');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      previewFile(file);
    }
  };

  const previewFile = async (file: File) => {
    const text = await file.text();
    
    try {
      if (importType === 'json') {
        const data = JSON.parse(text);
        setPreviewData(Array.isArray(data) ? data.slice(0, 3) : [data].slice(0, 3));
      } else {
        // CSV parsing
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const questions: Record<string, string>[] = [];
        
        for (let i = 1; i < Math.min(4, lines.length); i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const question: Record<string, string> = {};
            headers.forEach((header, index) => {
              question[header] = values[index];
            });
            questions.push(question);
          }
        }
        setPreviewData(questions);
      }
    } catch (error) {
      console.error('Failed to preview file:', error);
      setPreviewData([]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !user) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await selectedFile.text();
      let questions = [];

      if (importType === 'json') {
        questions = JSON.parse(text);
      } else {
        // Parse CSV
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            const question: Record<string, unknown> = {};
            
            headers.forEach((header, index) => {
              if (header === 'options') {
                // Parse options as JSON
                try {
                  question[header] = JSON.parse(values[index]);
                } catch {
                  question[header] = [];
                }
              } else {
                question[header] = values[index];
              }
            });
            
            questions.push(question);
          }
        }
      }

      const getString = (value: unknown) => (typeof value === 'string' ? value : '');
      const fallbackOptionIds = ['a', 'b', 'c', 'd'];
      const allowedDifficulties = new Set(['easy', 'medium', 'hard']);

      type NormalizedQuestion = Record<string, unknown>;
      const normalizedQuestions: NormalizedQuestion[] = [];

      for (const rawQuestion of questions as Array<Record<string, unknown>>) {
        const q = rawQuestion as Record<string, unknown> & { [key: string]: unknown };

        const textCandidate = getString(q.text ?? q.question);
        const text = textCandidate.trim();
        if (!text) continue;

        const rawOptions: Array<Record<string, unknown>> = Array.isArray(q.options)
          ? (q.options as Array<Record<string, unknown>>)
          : fallbackOptionIds.map((id) => ({
              id,
              text: getString(q[`option${id.toUpperCase()}`])
            }));

        const options = rawOptions
          .map((option, index) => {
            const idValue = getString(option.id);
            const textValue = getString(option.text).trim();
            return {
              id: idValue ? idValue.toLowerCase() : fallbackOptionIds[index] ?? `option${index + 1}`,
              text: textValue,
            };
          })
          .filter((option) => option.text.length > 0);

        if (!options.length) continue;

        const correctAnswerCandidate = getString(q.correctAnswerId ?? q.correctAnswer).trim().toLowerCase();
        if (!correctAnswerCandidate) continue;
        if (!options.some((option) => option.id === correctAnswerCandidate)) continue;

        const subjectName = getString(q.subjectName ?? q.subject).trim();
        const topicName = getString(q.topicName ?? q.topic).trim();
        const topicId = getString(q.topicId).trim();

        if (!topicId && !topicName && !subjectName) continue;

        const difficultyCandidate = getString(q.difficulty).toLowerCase();
        const difficulty = allowedDifficulties.has(difficultyCandidate)
          ? difficultyCandidate
          : 'medium';

        const explanation = getString(q.explanation).trim();

        const normalized: NormalizedQuestion = {
          text,
          options,
          correctAnswerId: correctAnswerCandidate,
          explanation,
          difficulty,
        };

        if (topicId) normalized.topicId = topicId;
        if (subjectName) normalized.subjectName = subjectName;
        if (topicName) normalized.topicName = topicName;

        normalizedQuestions.push(normalized);
      }

      if (!normalizedQuestions.length) {
        setResult({
          success: false,
          message: 'No valid questions found. Make sure each entry has text, options, correctAnswerId, and either topicId or subject/topic names.',
        });
        return;
      }

      const response = await fetch(`${API_URL}/admin/questions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id,
        },
        body: JSON.stringify({ questions: normalizedQuestions }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      
      if (response.ok) {
        setResult({
          success: true,
          created: data?.created,
          message:
            data?.message ||
            `Successfully imported ${data?.created ?? normalizedQuestions.length} questions`,
        });
      } else {
        setResult({
          success: false,
          message: data?.error || 'Import failed',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: 'Failed to import questions. Please check your file format.',
      });
    } finally {
      setImporting(false);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const downloadTemplate = () => {
    if (importType === 'json') {
      const template = [
        {
          text: "Which planet is known as the 'Red Planet'?",
          options: [
            { id: "a", text: "Jupiter" },
            { id: "b", text: "Mars" },
            { id: "c", text: "Venus" },
            { id: "d", text: "Saturn" }
          ],
          correctAnswerId: "b",
          explanation: "Mars is often called the Red Planet because of its iron oxide rich surface.",
          difficulty: "easy",
          subjectName: "General Knowledge",
          topicName: "Planets"
        },
        {
          text: "Who painted the 'Mona Lisa'?",
          options: [
            { id: "a", text: "Vincent van Gogh" },
            { id: "b", text: "Pablo Picasso" },
            { id: "c", text: "Leonardo da Vinci" },
            { id: "d", text: "Claude Monet" }
          ],
          correctAnswerId: "c",
          explanation: "The Mona Lisa was painted by Leonardo da Vinci during the Renaissance.",
          difficulty: "medium",
          topicId: "YOUR_TOPIC_ID_HERE"
        }
      ];
      
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quiz-template.json';
      a.click();
    } else {
      const csv = `text,optionA,optionB,optionC,optionD,correctAnswerId,explanation,difficulty,subjectName,topicName,topicId
"Which planet is known as the 'Red Planet'?","Jupiter","Mars","Venus","Saturn","b","Mars is called the Red Planet because of its appearance.","easy","General Knowledge","Planets",
"Who painted the 'Mona Lisa'?","Vincent van Gogh","Pablo Picasso","Leonardo da Vinci","Claude Monet","c","A Renaissance masterpiece housed in the Louvre.","medium",,,"YOUR_TOPIC_ID_HERE"`;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quiz-template.csv';
      a.click();
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Import</h1>
        <p className="text-gray-600">Import multiple questions at once</p>
      </div>

      {/* Format Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Import Format</CardTitle>
          <CardDescription>
            Choose the format of your import file. Each question must include text, options,
            a correct answer, and either a topic ID or subject/topic names.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setImportType('json')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                importType === 'json'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <FileJson className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">JSON Format</h3>
              <p className="text-sm text-gray-600 mt-1">
                Import questions in JSON format with full control over structure
              </p>
            </button>
            
            <button
              onClick={() => setImportType('csv')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                importType === 'csv'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">CSV Format</h3>
              <p className="text-sm text-gray-600 mt-1">
                Import questions from spreadsheet applications
              </p>
            </button>
          </div>
          
          <Button
            variant="outline"
            className="mt-4"
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4 mr-2" />
            Download {importType.toUpperCase()} Template
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Select your {importType.toUpperCase()} file containing questions. Provide either a
            <code className="px-1">topicId</code> or <code className="px-1">subjectName</code> plus
            <code className="px-1">topicName</code> for each row.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Click to upload
              </span>
              <span className="text-gray-700"> or drag and drop</span>
              <input
                type="file"
                accept={importType === 'json' ? '.json' : '.csv'}
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-600 mt-2">
              {importType === 'json'
                ? 'JSON files only (supports subjectName/topicName or topicId)'
                : 'CSV files only (include subjectName/topicName columns or topicId)'}
            </p>
            {selectedFile && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-800">
                  Selected: {selectedFile.name}
                </p>
                <p className="text-xs text-gray-700">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preview (First 3 Questions)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previewData.map((q, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{String(q.text || q.question || 'No text')}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Subject: {String(q.subjectName || q.subject || 'Not specified')} |
                    {' '}Topic: {String(q.topicName || q.topic || q.topicId || 'Not specified')} |
                    {' '}Difficulty: {String(q.difficulty || 'medium')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {result && (
        <Card className={cn(
          'mb-6',
          result.success ? 'border-green-500' : 'border-red-500'
        )}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={cn(
                  'font-medium',
                  result.success ? 'text-green-900' : 'text-red-900'
                )}>
                  {result.message}
                </p>
                {result.created && (
                  <p className="text-sm text-gray-600 mt-1">
                    {result.created} questions were successfully imported
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleImport}
          disabled={!selectedFile || importing}
          size="lg"
        >
          {importing ? (
            <>Importing...</>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import Questions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

