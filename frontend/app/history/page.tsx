'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, Trash2, Download, Eye, Search, 
  ChevronLeft, ChevronRight, Home, FileJson
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateGrade } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface QuizAttempt {
  id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timestamp: number;
  timeSpent: number;
  difficulty?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<QuizAttempt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'subject'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const itemsPerPage = 10;

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterAndSortHistory();
  }, [history, searchTerm, sortBy, sortOrder]);

  const loadHistory = () => {
    const stored = localStorage.getItem('quiz-history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setHistory([]);
      }
    }
  };

  const filterAndSortHistory = () => {
    let filtered = [...history];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = a.timestamp - b.timestamp;
          break;
        case 'score':
          compareValue = a.percentage - b.percentage;
          break;
        case 'subject':
          compareValue = a.subjectName.localeCompare(b.subjectName);
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    setFilteredHistory(filtered);
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(item => item.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = () => {
    const remaining = history.filter(item => !selectedItems.has(item.id));
    localStorage.setItem('quiz-history', JSON.stringify(remaining));
    setHistory(remaining);
    setSelectedItems(new Set());
    setShowDeleteDialog(false);
  };

  const handleExportSelected = () => {
    const toExport = selectedItems.size > 0 
      ? history.filter(item => selectedItems.has(item.id))
      : filteredHistory;
    
    const dataStr = JSON.stringify(toExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `quiz-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...history, ...imported];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          localStorage.setItem('quiz-history', JSON.stringify(unique));
          setHistory(unique);
        }
      } catch (error) {
        console.error('Failed to import history:', error);
      }
    };
    reader.readAsText(file);
  };

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quiz History</h1>
              <p className="text-sm text-gray-600">Manage your quiz attempts</p>
            </div>
            <Button onClick={() => router.push('/')} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Actions Bar */}
        <Card className="mb-6 border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by topic or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 rounded-lg font-bold"
                />
              </div>
              
              {/* Sort Controls */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border-2 rounded-lg font-bold"
                >
                  <option value="date">Sort by Date</option>
                  <option value="score">Sort by Score</option>
                  <option value="subject">Sort by Subject</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="font-bold"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                  disabled={filteredHistory.length === 0}
                  className="font-bold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                
                <label className="cursor-pointer">
                  <div className="px-4 py-2 text-sm font-bold border-2 rounded-md hover:bg-gray-100 flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    Import
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportHistory}
                    className="hidden"
                  />
                </label>
                
                {selectedItems.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="font-bold"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedItems.size})
                  </Button>
                )}
              </div>
            </div>
            
            {/* Summary Stats */}
            <div className="flex gap-4 mt-4 text-sm text-gray-600 font-bold">
              <span>Total: {filteredHistory.length} quizzes</span>
              <span>•</span>
              <span>Selected: {selectedItems.size}</span>
              {searchTerm && (
                <>
                  <span>•</span>
                  <span>Filtered from {history.length} total</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="border-2">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === filteredHistory.length && filteredHistory.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-4 text-left font-bold">Date</th>
                    <th className="p-4 text-left font-bold">Subject</th>
                    <th className="p-4 text-left font-bold">Topic</th>
                    <th className="p-4 text-left font-bold">Score</th>
                    <th className="p-4 text-left font-bold">Grade</th>
                    <th className="p-4 text-left font-bold">Time</th>
                    <th className="p-4 text-left font-bold">Difficulty</th>
                    <th className="p-4 text-left font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.map((item) => {
                    const { grade, color } = calculateGrade(item.percentage);
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-bold">{format(item.timestamp, 'MMM d, yyyy')}</div>
                          <div className="text-xs text-gray-500 font-bold">
                            {format(item.timestamp, 'h:mm a')}
                          </div>
                        </td>
                        <td className="p-4 font-bold">{item.subjectName}</td>
                        <td className="p-4 font-bold">{item.topicName}</td>
                        <td className="p-4">
                          <div className="font-bold">{item.percentage.toFixed(1)}%</div>
                          <div className="text-xs text-gray-500 font-bold">
                            {item.correctAnswers}/{item.totalQuestions}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold ${color}`}>{grade}</span>
                        </td>
                        <td className="p-4 font-bold">
                          {Math.floor(item.timeSpent / 60)}:{(item.timeSpent % 60).toString().padStart(2, '0')}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">
                            {item.difficulty || 'Medium'}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              router.push(`/quiz/${item.topicId}/review`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {paginatedHistory.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-bold">
                    {searchTerm ? 'No quizzes found matching your search' : 'No quiz history yet'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="font-bold"
                >
                  {page}
                </Button>
              );
            })}
            
            {totalPages > 5 && <span className="font-bold">...</span>}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="font-bold"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Quiz History"
        message={`Are you sure you want to delete ${selectedItems.size} selected quiz${selectedItems.size > 1 ? 'zes' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteSelected}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
      />
    </div>
  );
}
