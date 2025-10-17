'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Search } from 'lucide-react';
import { LANGUAGES, LanguageCode } from '@/lib/i18n/config';

export interface FilterState {
  search: string;
  difficulty: string[];
  languages: LanguageCode[];
  tags: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  scoreRange: {
    min: number;
    max: number;
  };
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  availableTags?: string[];
  showAdvanced?: boolean;
}

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];

export const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  availableTags = [],
  showAdvanced = true
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    difficulty: [],
    languages: [],
    tags: [],
    dateRange: { from: null, to: null },
    scoreRange: { min: 0, max: 100 }
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Handle search input
  const handleSearchChange = useCallback(
    (value: string) => {
      const updated = { ...filters, search: value };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  // Handle difficulty toggle
  const toggleDifficulty = useCallback(
    (difficulty: string) => {
      const updated = {
        ...filters,
        difficulty: filters.difficulty.includes(difficulty)
          ? filters.difficulty.filter((d) => d !== difficulty)
          : [...filters.difficulty, difficulty]
      };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  // Handle language toggle
  const toggleLanguage = useCallback(
    (lang: LanguageCode) => {
      const updated = {
        ...filters,
        languages: filters.languages.includes(lang)
          ? filters.languages.filter((l) => l !== lang)
          : [...filters.languages, lang]
      };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  // Handle tag toggle
  const toggleTag = useCallback(
    (tag: string) => {
      const updated = {
        ...filters,
        tags: filters.tags.includes(tag)
          ? filters.tags.filter((t) => t !== tag)
          : [...filters.tags, tag]
      };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  // Handle date range
  const updateDateRange = useCallback(
    (type: 'from' | 'to', date: Date | null) => {
      const updated = {
        ...filters,
        dateRange: {
          ...filters.dateRange,
          [type]: date
        }
      };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  // Handle score range
  const updateScoreRange = useCallback(
    (type: 'min' | 'max', value: number) => {
      const updated = {
        ...filters,
        scoreRange: {
          ...filters.scoreRange,
          [type]: value
        }
      };
      setFilters(updated);
      onFilterChange(updated);
    },
    [filters, onFilterChange]
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    const empty: FilterState = {
      search: '',
      difficulty: [],
      languages: [],
      tags: [],
      dateRange: { from: null, to: null },
      scoreRange: { min: 0, max: 100 }
    };
    setFilters(empty);
    onFilterChange(empty);
  }, [onFilterChange]);

  // Count active filters
  const activeFilterCount =
    filters.search.length +
    filters.difficulty.length +
    filters.languages.length +
    filters.tags.length +
    (filters.dateRange.from ? 1 : 0) +
    (filters.dateRange.to ? 1 : 0) +
    (filters.scoreRange.min > 0 || filters.scoreRange.max < 100 ? 1 : 0);

  return (
    <div className="w-full space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 focus:outline-none transition"
          />
        </div>

        {/* Toggle Advanced Filters */}
        {showAdvanced && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
              isExpanded || activeFilterCount > 0
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-1 rounded-full bg-white/30 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition ${isExpanded ? 'rotate-180' : ''}`} />
          </motion.button>
        )}

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 font-semibold hover:bg-red-200 dark:hover:bg-red-800 transition flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Reset
          </motion.button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isExpanded && showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-6">
              {/* Difficulty Filter */}
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  Difficulty
                  {filters.difficulty.length > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500 text-white">
                      {filters.difficulty.length}
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <motion.button
                      key={difficulty}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleDifficulty(difficulty)}
                      className={`px-3 py-2 rounded-lg font-semibold transition ${
                        filters.difficulty.includes(difficulty)
                          ? difficulty === 'easy'
                            ? 'bg-green-500 text-white'
                            : difficulty === 'medium'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Language Filter */}
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  Languages
                  {filters.languages.length > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500 text-white">
                      {filters.languages.length}
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(LANGUAGES) as LanguageCode[]).map((lang) => (
                    <motion.button
                      key={lang}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-2 rounded-lg font-semibold transition ${
                        filters.languages.includes(lang)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {LANGUAGES[lang].flag} {LANGUAGES[lang].nativeName}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    Tags
                    {filters.tags.length > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500 text-white">
                        {filters.tags.length}
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <motion.button
                        key={tag}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-2 rounded-lg font-semibold transition text-sm ${
                          filters.tags.includes(tag)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        # {tag}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div>
                <h3 className="font-bold mb-3">Date Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">From</label>
                    <input
                      type="date"
                      value={filters.dateRange.from?.toISOString().split('T')[0] || ''}
                      onChange={(e) => updateDateRange('from', e.target.value ? new Date(e.target.value) : null)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">To</label>
                    <input
                      type="date"
                      value={filters.dateRange.to?.toISOString().split('T')[0] || ''}
                      onChange={(e) => updateDateRange('to', e.target.value ? new Date(e.target.value) : null)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Score Range Filter */}
              <div>
                <h3 className="font-bold mb-3 flex items-center justify-between">
                  Average Score Range
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    {filters.scoreRange.min}% - {filters.scoreRange.max}%
                  </span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Minimum</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.scoreRange.min}
                      onChange={(e) => updateScoreRange('min', parseInt(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Maximum</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.scoreRange.max}
                      onChange={(e) => updateScoreRange('max', parseInt(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          {filters.search && (
            <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 text-sm font-semibold flex items-center gap-2">
              🔍 {filters.search}
              <button
                onClick={() => handleSearchChange('')}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {filters.difficulty.map((d) => (
            <div
              key={d}
              className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold flex items-center gap-2"
            >
              {d}
              <button
                onClick={() => toggleDifficulty(d)}
                className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {filters.languages.map((l) => (
            <div
              key={l}
              className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 text-sm font-semibold flex items-center gap-2"
            >
              {LANGUAGES[l].flag}
              <button
                onClick={() => toggleLanguage(l)}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {filters.tags.map((t) => (
            <div
              key={t}
              className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100 text-sm font-semibold flex items-center gap-2"
            >
              #{t}
              <button
                onClick={() => toggleTag(t)}
                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default FilterBar;
