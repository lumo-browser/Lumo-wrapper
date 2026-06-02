/**
 * SearchBar Component - Professional Version
 * Main search input for Lumo Browser home page
 */

import React, { useState } from 'react';
import { Search, Send } from 'lucide-react';
import clsx from 'clsx';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'What would you like to accomplish?',
}: SearchBarProps): React.ReactElement {
  const [query, setQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  const suggestedSearches = [
    'Research a company',
    'Find product alternatives',
    'Summarize an article',
    'Compare pricing plans',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={clsx('w-5 h-5 transition-colors', isFocused ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500')} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={clsx(
              'w-full pl-12 pr-14 py-3 rounded-lg',
              'border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-white',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
              'focus:border-transparent',
              'transition-all duration-200',
              'group-hover:border-gray-300 dark:group-hover:border-gray-600'
            )}
            autoFocus
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className={clsx(
              'absolute inset-y-0 right-0 px-4 flex items-center',
              'text-white font-medium rounded-r-lg',
              'transition-all duration-200',
              query.trim()
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
            )}
            aria-label="Search"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggested Searches */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-1">
          Try these searches
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedSearches.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setQuery(suggestion);
                onSearch(suggestion);
              }}
              className={clsx(
                'px-4 py-3 text-sm font-medium text-left',
                'bg-gray-50 dark:bg-gray-800',
                'border border-gray-200 dark:border-gray-700',
                'text-gray-700 dark:text-gray-300',
                'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:border-blue-500',
                'rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
