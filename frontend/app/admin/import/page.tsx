'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileJson, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

      // Validate and transform questions
      const validQuestions = questions.map((q: Record<string, unknown>) => ({
        text: q.text || q.question,
        options: q.options || [
          { id: 'a', text: q.optionA || '' },
          { id: 'b', text: q.optionB || '' },
          { id: 'c', text: q.optionC || '' },
          { id: 'd', text: q.optionD || '' },
        ],
        correctAnswerId: q.correctAnswerId || q.correctAnswer || 'a',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        topicId: q.topicId,
      })).filter((q: { text: unknown; topicId: unknown }) => q.text && q.topicId);

      const response = await fetch('http://localhost:5001/api/admin/questions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id,
        },
        body: JSON.stringify({ questions: validQuestions }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          created: data.created,
          message: data.message || `Successfully imported ${data.created} questions`,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Import failed',
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
          text: "What is React?",
          options: [
            { id: "a", text: "A JavaScript library for building user interfaces" },
            { id: "b", text: "A database" },
            { id: "c", text: "A CSS framework" },
            { id: "d", text: "A testing tool" }
          ],
          correctAnswerId: "a",
          explanation: "React is a JavaScript library developed by Facebook for building user interfaces.",
          difficulty: "easy",
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
      const csv = `text,optionA,optionB,optionC,optionD,correctAnswerId,explanation,difficulty,topicId
"What is React?","A JavaScript library","A database","A CSS framework","A testing tool","a","React is a JavaScript library","easy","YOUR_TOPIC_ID_HERE"`;
      
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
          <CardDescription>Choose the format of your import file</CardDescription>
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
          <CardDescription>Select your {importType.toUpperCase()} file containing questions</CardDescription>
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
              {importType === 'json' ? 'JSON files only' : 'CSV files only'}
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
                    Difficulty: {String(q.difficulty || 'medium')} | 
                    Topic ID: {String(q.topicId || 'Not specified')}
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
