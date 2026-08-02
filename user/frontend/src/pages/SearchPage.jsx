import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { productsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function SearchPage() {
  const { pincode } = useCart();
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef(null);

  // Load all products once for instant filtering — no pincode param, filter client-side
  useEffect(() => {
    productsApi.getAll()
      .then(r => {
        const all = r.data || [];
        // client-side pincode filter
        const filtered = all.filter(p => {
          if (!pincode) return true;
          if (!p.pincodesAvailable || p.pincodesAvailable.length === 0) return true;
          return p.pincodesAvailable.includes(pincode);
        });
        setAll(filtered);
      })
      .catch(console.error);
    inputRef.current?.focus();
  }, [pincode]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const q = query.toLowerCase();
    const filtered = all.filter(p =>
      (p.name        || '').toLowerCase().includes(q) ||
      (p.brand       || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.sku         || '').toLowerCase().includes(q)
    );
    setResults(filtered);
    setLoading(false);
  }, [query, all]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-100 rounded-xl">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input ref={inputRef} type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search groceries, brands, products…"
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-gray-800" />
            {query && (
              <button onClick={() => setQuery('')} className="btn-press w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <X size={10} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Idle state */}
        {!query && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={48} className="text-gray-200 mb-4" />
            <p className="text-sm font-bold text-gray-600">Search for products</p>
            <p className="text-xs text-gray-400 mt-1">Type a product name, brand or category</p>
          </div>
        )}

        {/* Loading */}
        {loading && query && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full spin" />
          </div>
        )}

        {/* Results */}
        {!loading && query && (
          <>
            <p className="text-xs text-gray-500 font-semibold mb-3">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">🔍</span>
                <p className="text-sm font-bold text-gray-600">No products found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {results.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
