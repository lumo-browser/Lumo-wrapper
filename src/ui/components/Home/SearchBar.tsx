/**
 * SearchBar Component
 * Main search input for Nova Browser home page
 */

import React, { useState } from 'react';
import clsx from 'clsx';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'What would you like to accomplish?' }: SearchBarProps): React.ReactElement {
  const [query, setQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={clsx(
            'relative rounded-full transition-all duration-300 shadow-lg',
            isFocused
              ? 'ring-2 ring-blue-500 shadow-blue-500/50'
              : 'hover:shadow-xl dark:hover:shadow-blue-500/20'
          )}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={clsx(
              'w-full px-6 py-4 pr-12 rounded-full',
              'bg-white dark:bg-gray-900',
              'text-gray-900 dark:text-white',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'border-none outline-none',
              'text-lg transition-colors'
            )}
            autoFocus
          />

          <button
            type="submit"
            className={clsx(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'p-2 rounded-full',
              'bg-blue-500 hover:bg-blue-600 text-white',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={!query.trim()}
            aria-label="Search"
          >
            <span className="text-xl">✨</span>
          </button>
        </div>
      </form>

      {/* Suggested searches */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-gray-500 dark:text-gray-400 w-full text-center mb-2">
          Try searching:
        </span>
        {['Research a company', 'Find best laptop', 'Summarize this website', 'Compare products'].map(
          (suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setQuery(suggestion);
                onSearch(suggestion);
              }}
              className={clsx(
                'px-3 py-1 rounded-full text-sm',
                'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-300 dark:hover:bg-gray-700',
                'transition-colors duration-200'
              )}
            >
              {suggestion}
            </button>
          )
        )}
      </div>
    </div>
  );
}
