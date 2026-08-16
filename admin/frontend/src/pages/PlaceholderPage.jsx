import React from 'react';
import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title = 'Coming Soon', desc = 'This section is under construction.' }) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
 <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
 <Construction size={28} className="text-gray-400" />
 </div>
 <h2 className="text-base font-semibold text-gray-700">{title}</h2>
 <p className="text-sm text-gray-400 mt-1 max-w-xs">{desc}</p>
 </div>
 );
}
