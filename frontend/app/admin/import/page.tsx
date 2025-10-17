'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileJson, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/config';
import { useToast } from '@/providers/toast-provider';

type ImportMode = 'override' | 'perRow';

interface SubjectOption {
  id: string;
  name: string;
  topics: {
    id: string;
    name: string;
    subjectId: string;
  }[];
}

interface ImportResult {
  success: boolean;
  created?: number;
  message: string;
}

export default function BulkImportPage() {
  const { user } = useUser();
  const { showToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'json' | 'csv'>('json');
  const [jsonFormat, setJsonFormat] = useState<'old' | 'new'>('old');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [mode, setMode] = useState<ImportMode>('override');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [createSubject, setCreateSubject] = useState(false);
  const [createTopic, setCreateTopic] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicName, setNewTopicName] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const response = await fetch(`${API_URL}/admin/subjects`, {
          headers: { 'x-clerk-user-id': user.id },
        });
        const data = await response.json().catch(() => null);
        if (response.ok) {
          setSubjects(data || []);
        } else {
          showToast({
            variant: 'error',
            title: data?.error || 'Failed to fetch subjects.',
          });
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        showToast({ variant: 'error', title: 'Failed to fetch subjects.' });
      }
    })();
  }, [user]);

  const currentSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      previewFile(file);
    }
  };

  const previewFile = async (file: File) => {
    const text = await file.text();
    try {
      if (importType === 'json') {
        const json = JSON.parse(text);
        const normalized = Array.isArray(json) ? json : [json];
        setPreviewData(
          normalized.slice(0, 3).map((item) => ({
            ...item,
            pyq: typeof item?.pyq === 'string' ? item.pyq : '',
          }))
        );
      } else {
        const lines = text.split('\n').filter(Boolean);
        if (!lines.length) return setPreviewData([]);
        const headers = lines[0].split(',').map((header) => header.trim());
        const rows: any[] = [];
        for (let i = 1; i < Math.min(lines.length, 4); i++) {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx];
          });
          rows.push(row);
        }
        setPreviewData(
          rows.map((row) => ({
            ...row,
            pyq: row.pyq || row.PYQ || row.pyqLabel || '',
          }))
        );
      }
    } catch (error) {
      console.error('Failed to preview file:', error);
      setPreviewData([]);
      showToast({
        variant: 'error',
        title: 'Failed to preview file.',
        description: 'Check the file format and try again.',
      });
    }
  };

  const parseCSVLine = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
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
      let json: any[] = [];
      if (jsonFormat === 'old') {
        json = [
          {
            text: "Which planet is known as the 'Red Planet'?",
            options: [
              { id: 'a', text: 'Jupiter' },
              { id: 'b', text: 'Mars' },
              { id: 'c', text: 'Venus' },
              { id: 'd', text: 'Saturn' },
            ],
            correctAnswerId: 'b',
            explanation: 'Mars appears red due to iron oxide on its surface.',
            difficulty: 'easy',
            subjectName: 'General Knowledge',
            topicName: 'Planets',
            pyq: '[2019]',
          },
          {
            text: "Who painted the 'Mona Lisa'?",
            options: [
              { id: 'a', text: 'Vincent van Gogh' },
              { id: 'b', text: 'Pablo Picasso' },
              { id: 'c', text: 'Leonardo da Vinci' },
              { id: 'd', text: 'Claude Monet' },
            ],
            correctAnswerId: 'c',
            difficulty: 'medium',
            topicId: 'YOUR_TOPIC_ID_HERE',
            pyq: 'Art Olympiad 2021',
          },
        ];
      } else {
        // New multilingual JSON format template
        json = [
          {
            question: {
              en: "Which planet is known as the 'Red Planet'?",
              hi: 'कौन सा ग्रह “लाल ग्रह” के रूप में जाना जाता है?'
            },
            options: {
              en: ['Jupiter', 'Mars', 'Venus', 'Saturn'],
              hi: ['बृहस्पति', 'मंगल', 'शुक्र', 'शनि']
            },
            correctAnswer: 1, // 0=a, 1=b, 2=c, 3=d
            explanation: {
              en: 'Mars appears red due to iron oxide on its surface.',
              hi: 'मंगल की सतह पर आयरन ऑक्साइड होने से यह लाल दिखाई देता है।'
            },
            difficulty: 'easy',
            subjectName: 'General Knowledge',
            topicName: 'Planets',
            pyq: '[2019]'
          },
          {
            question: {
              en: "Who painted the 'Mona Lisa'?",
              hi: '“मोना लिसा” पेंटिंग किसने बनाई?'
            },
            options: {
              en: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet'],
              hi: ['विन्सेंट वैन गॉग', 'पाब्लो पिकासो', 'लियोनार्डो दा विंची', 'क्लाउड मोने']
            },
            correctAnswer: 2,
            explanation: {
              en: 'A Renaissance masterpiece.',
              hi: 'एक पुनर्जागरण की उत्कृष्ट कृति।'
            },
            difficulty: 'medium',
            // You can provide either per-row placement (subject/topic names)
            subjectName: 'Art',
            topicName: 'Renaissance',
            // Or use a direct topicId if you already know the target
            // topicId: 'YOUR_TOPIC_ID_HERE',
            pyq: 'Art Olympiad 2021'
          }
        ];
      }
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = jsonFormat === 'new' ? 'quiz-template-new.json' : 'quiz-template.json';
      link.click();
    } else {
      const csv = `text,optionA,optionB,optionC,optionD,correctAnswerId,explanation,difficulty,subjectName,topicName,topicId,pyq\n"Which planet is known as the 'Red Planet'?","Jupiter","Mars","Venus","Saturn","b","Mars appears red due to iron oxide.","easy","General Knowledge","Planets",,"[2019]"\n"Who painted the 'Mona Lisa'?","Vincent van Gogh","Pablo Picasso","Leonardo da Vinci","Claude Monet","c","A Renaissance masterpiece.","medium",,,"YOUR_TOPIC_ID_HERE","Art Olympiad 2021"`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quiz-template.csv';
      link.click();
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !user) return;
    setImporting(true);
    setResult(null);

    try {
      const text = await selectedFile.text();
      let records: any[] = [];

      if (importType === 'json') {
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = text.split('\n').filter(Boolean);
        if (!lines.length) throw new Error('CSV file is empty');
        const headers = lines[0].split(',').map((header) => header.trim());
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const entry: Record<string, string> = {};
          headers.forEach((header, idx) => {
            entry[header] = values[idx];
          });
          const options = [
            { id: 'a', text: entry.optionA || '' },
            { id: 'b', text: entry.optionB || '' },
            { id: 'c', text: entry.optionC || '' },
            { id: 'd', text: entry.optionD || '' },
          ];
          records.push({
            text: entry.text,
            options,
            correctAnswerId: entry.correctAnswerId,
            explanation: entry.explanation,
            difficulty: entry.difficulty,
            subjectName: entry.subjectName,
            topicName: entry.topicName,
            topicId: entry.topicId,
            pyq: entry.pyq,
          });
        }
      }

      const payload: Record<string, unknown> = {
        questions: records,
        mode,
      };

      if (mode === 'override') {
        if (createSubject) {
          payload.defaultSubjectName = newSubjectName.trim();
        } else {
          payload.defaultSubjectId = selectedSubjectId || undefined;
        }

        if (createTopic) {
          payload.defaultTopicName = newTopicName.trim();
        } else {
          payload.defaultTopicId = selectedTopicId || undefined;
        }
      }

      const response = await fetch(`${API_URL}/admin/questions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Import failed');
      }

      const successMessage = data?.message || `Imported ${data?.created ?? records.length} questions`;
      setResult({
        success: true,
        created: data?.created,
        message: successMessage,
      });
      setSelectedFile(null);
      setPreviewData([]);
      showToast({
        variant: 'success',
        title: 'Import complete.',
        description: successMessage,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      const message = error?.message || 'Failed to import questions';
      setResult({
        success: false,
        message,
      });
      showToast({ variant: 'error', title: message });
    } finally {
      setImporting(false);
    }
  };

  const canSubmitOverride = mode === 'override'
    ? (createSubject ? newSubjectName.trim().length > 0 : selectedSubjectId) &&
      (createTopic ? newTopicName.trim().length > 0 : selectedTopicId)
    : true;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Import</h1>
        <p className="text-gray-600">Upload questions, preview them, pick a destination, and import.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Import Format</CardTitle>
          <CardDescription>Questions can be provided in JSON or CSV format.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setImportType('json')}
              className={cn(
                'p-4 rounded-lg border-2 transition-colors',
                importType === 'json' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <FileJson className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">JSON format</h3>
              <p className="mt-1 text-sm text-gray-600">Full control over structure and metadata.</p>
            </button>
            <button
              onClick={() => setImportType('csv')}
              className={cn(
                'p-4 rounded-lg border-2 transition-colors',
                importType === 'csv' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <FileText className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <h3 className="font-semibold">CSV format</h3>
              <p className="mt-1 text-sm text-gray-600">Great for spreadsheet workflows.</p>
            </button>
          </div>
          {importType === 'json' && (
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-800">JSON schema</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="old"
                    checked={jsonFormat === 'old'}
                    onChange={() => setJsonFormat('old')}
                  />
                  <span className="text-gray-900">Old format (text + options array)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="new"
                    checked={jsonFormat === 'new'}
                    onChange={() => setJsonFormat('new')}
                  />
                  <span className="text-gray-900">New format (multilingual + index answer)</span>
                </label>
              </div>
            </div>
          )}
          <Button variant="outline" className="mt-4" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download {importType.toUpperCase()} template{importType === 'json' ? ` (${jsonFormat})` : ''}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload file</CardTitle>
          <CardDescription>
            Choose your {importType.toUpperCase()} file. Each question needs text, options, correct answer, and a destination (topicId or subject/topic names).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-500" />
            <label className="cursor-pointer">
              <span className="font-medium text-blue-600 hover:text-blue-700">Click to upload</span>
              <span className="text-gray-700"> or drag and drop</span>
              <input
                type="file"
                accept={importType === 'json' ? '.json' : '.csv'}
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="mt-2 text-sm text-gray-600">
              {importType === 'json'
                ? 'JSON files (.json)'
                : 'CSV files (.csv) with headings text, optionA-D, correctAnswerId, etc.'}
            </p>
            {selectedFile && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800">Selected: {selectedFile.name}</p>
                <p className="text-xs text-gray-600">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {previewData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preview (first 3 entries)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {previewData.map((item, index) => (
                <div key={index} className="rounded-lg bg-gray-50 p-3">
                  <p className="font-medium text-gray-900">{item.text || item.question || 'Untitled question'}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Subject: {item.subjectName || item.subject || '—'} · Topic: {item.topicName || item.topic || item.topicId || '—'} · Difficulty: {item.difficulty || 'medium'}
                    {item.pyq && (
                      <>
                        {' '}· PYQ: {item.pyq}
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Destination</CardTitle>
          <CardDescription>Select how the questions should be placed in your catalog.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="override"
                checked={mode === 'override'}
                onChange={() => setMode('override')}
              />
              <span className="font-medium text-gray-900">Override destination: put everything into one Subject/Topic</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="perRow"
                checked={mode === 'perRow'}
                onChange={() => setMode('perRow')}
              />
              <span className="font-medium text-gray-900">Use subject/topic from file (per row)</span>
            </label>
          </div>

          {mode === 'override' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">Subject</label>
                {!createSubject ? (
                  <>
                    <select
                      value={selectedSubjectId}
                      onChange={(event) => {
                        setSelectedSubjectId(event.target.value);
                        setSelectedTopicId('');
                        setCreateTopic(false);
                        setNewTopicName('');
                      }}
                      className="w-full rounded-lg border p-2 text-gray-900"
                    >
                      <option value="">Select an existing subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={() => {
                      setCreateSubject(true);
                      setNewSubjectName('');
                      setSelectedSubjectId('');
                      setSelectedTopicId('');
                      setCreateTopic(true);
                    }}>
                      + Create new subject
                    </Button>
                  </>
                ) : (
                  <>
                    <input
                      value={newSubjectName}
                      onChange={(event) => setNewSubjectName(event.target.value)}
                      placeholder="New subject name"
                      className="w-full rounded-lg border p-2 text-gray-900 placeholder:text-gray-500"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setCreateSubject(false);
                        setNewSubjectName('');
                        setCreateTopic(false);
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">Topic</label>
                {!createTopic ? (
                  <>
                    <select
                      value={selectedTopicId}
                      onChange={(event) => setSelectedTopicId(event.target.value)}
                      disabled={createSubject || (!selectedSubjectId && !newSubjectName.trim())}
                      className="w-full rounded-lg border p-2 text-gray-900"
                    >
                      <option value="">Select an existing topic</option>
                      {(currentSubject?.topics || []).map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={() => {
                      setCreateTopic(true);
                      setNewTopicName('');
                    }}>
                      + Create new topic
                    </Button>
                  </>
                ) : (
                  <>
                    <input
                      value={newTopicName}
                      onChange={(event) => setNewTopicName(event.target.value)}
                      placeholder="New topic name"
                      className="w-full rounded-lg border p-2 text-gray-900 placeholder:text-gray-500"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setCreateTopic(false);
                        setNewTopicName('');
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className={cn('mb-6', result.success ? 'border-green-500' : 'border-red-500')}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className={cn('font-medium', result.success ? 'text-green-900' : 'text-red-900')}>
                  {result.message}
                </p>
                {typeof result.created === 'number' && (
                  <p className="mt-1 text-sm text-gray-600">{result.created} questions imported.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleImport}
          disabled={!selectedFile || importing || !canSubmitOverride}
        >
          {importing ? 'Importing…' : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import questions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

