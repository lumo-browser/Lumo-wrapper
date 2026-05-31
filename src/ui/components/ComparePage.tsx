import React from 'react';
import { ShoppingCart, ExternalLink } from 'lucide-react';

interface ComparePageProps {
  query: string;
}

export function ComparePage({ query }: ComparePageProps): React.ReactElement {
  const vendors = [
    {
      name: 'Amazon',
      color: 'border-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}` // Using .in assuming user from India due to flipkart request
    },
    {
      name: 'Flipkart',
      color: 'border-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`
    },
    {
      name: 'Croma',
      color: 'border-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-950/20',
      url: `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#333] shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            Smart Comparison
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Comparing prices for: <span className="font-semibold text-gray-700 dark:text-gray-300">"{query}"</span>
          </p>
        </div>
      </div>

      {/* Split Views */}
      <div className="flex-1 flex overflow-hidden">
        {vendors.map((vendor) => (
          <div key={vendor.name} className={`flex-1 flex flex-col border-r last:border-r-0 border-gray-200 dark:border-[#333]`}>
            {/* Vendor Header */}
            <div className={`px-4 py-2 flex items-center justify-between border-b-2 ${vendor.color} ${vendor.bg}`}>
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{vendor.name}</span>
            </div>
            
            {/* Webview Container */}
            <div className="flex-1 bg-white relative">
              <webview
                src={vendor.url}
                className="absolute inset-0 w-full h-full border-none"
                allowpopups="true"
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                partition="persist:nova-main"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
