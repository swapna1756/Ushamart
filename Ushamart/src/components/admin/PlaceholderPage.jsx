import React from 'react';
import { Construction } from 'lucide-react';

export function PlaceholderPage({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
        <Construction size={28} className="text-primary" />
      </div>
      <h2 className="text-base font-black text-gray-800">{title}</h2>
      <p className="text-xs text-gray-400 mt-2 max-w-xs">{description || 'This section is coming soon. Check back later.'}</p>
    </div>
  );
}
