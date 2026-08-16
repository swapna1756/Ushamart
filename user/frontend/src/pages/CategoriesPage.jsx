import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { productsApi, categoriesApi } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { resolveImageUrl } from '../utils/asset';

export default function CategoriesPage() {
 const { pincode } = useCart();
 const [searchParams] = useSearchParams();
 const initCat = searchParams.get('cat') || '';

 const [categories, setCategories] = useState([]);
 const [products, setProducts] = useState([]);
 const [selectedCat, setSelectedCat] = useState(initCat);
 const [sortOpt, setSortOpt] = useState('default');
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 // Fetch ALL products ... no pincode filter on server, filter client-side
 Promise.all([categoriesApi.getAll(), productsApi.getAll()])
 .then(([c, p]) => {
 const cats = c.data || [];
 setCategories(cats);
 // Client-side pincode filter
 const allProducts = p.data || [];
 const filtered = allProducts.filter(prod => {
 if (!pincode) return true;
 if (!prod.pincodesAvailable || prod.pincodesAvailable.length === 0) return true;
 return prod.pincodesAvailable.includes(pincode);
 });
 setProducts(filtered);
 if (!initCat && cats.length > 0) setSelectedCat(cats[0].id);
 })
 .catch(console.error)
 .finally(() => setLoading(false));
 }, [pincode]);

 const catProducts = products.filter(p => p.category === selectedCat);
 const sorted = [...catProducts].sort((a, b) => {
 if (sortOpt === 'low-high') return a.price - b.price;
 if (sortOpt === 'high-low') return b.price - a.price;
 if (sortOpt === 'savings') return ((b.mrp - b.price) / (b.mrp || 1)) - ((a.mrp - a.price) / (a.mrp || 1));
 return 0;
 });

 if (loading) return (
 <div className="flex items-center justify-center min-h-screen">
 <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full spin" />
 </div>
 );

 return (
 <div className="flex h-[calc(100vh-48px)] overflow-hidden min-w-0">
 {/* Left category sidebar */}
 <div className="hidden lg:flex w-24 bg-white border-r border-gray-100 flex-col overflow-y-auto no-scrollbar flex-shrink-0">
 {categories.map(cat => {
 const isActive = cat.id === selectedCat;
 return (
 <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
 className={`py-3 px-1.5 flex flex-col items-center gap-1 text-center border-l-4 transition ${
 isActive ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-gray-500 hover:bg-gray-50'
 }`}>
 <div className={`w-9 h-9 rounded-full overflow-hidden border bg-gray-50 flex items-center justify-center flex-shrink-0 ${isActive ? 'border-primary shadow-sm scale-110' : 'border-gray-200'}`}>
 {cat.icon
 ? <img src={resolveImageUrl(cat.icon)} alt={cat.name} className="w-full h-full object-cover"
 onError={e => { e.target.src = '/logo.png'; }} />
 : <span className="text-lg">{cat.emojiIcon || '??'}</span>}
 </div>
 <span className="text-[10px] font-medium leading-tight line-clamp-2">{cat.name}</span>
 </button>
 );
 })}
 {categories.length === 0 && (
 <p className="text-xs text-gray-400 text-center p-2 mt-4">No categories</p>
 )}
 </div>

 {/* Right product grid */}
 <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-w-0">
 <div className="lg:hidden bg-white border-b border-gray-100 px-3 py-2 overflow-x-auto no-scrollbar flex gap-2 flex-shrink-0">
 {categories.map(cat => {
 const isActive = cat.id === selectedCat;
 return (
 <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
 className={`min-h-10 px-3 rounded-full border text-xs font-medium whitespace-nowrap transition ${
 isActive ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-600'
 }`}>
 {cat.emojiIcon && cat.emojiIcon + ' '}{cat.name}
 </button>
 );
 })}
 </div>
 {/* Sort bar */}
 <div className="bg-white border-b border-gray-100 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
 <span className="text-xs text-muted font-medium">{sorted.length} items</span>
 <div className="flex items-center gap-1.5">
 <SlidersHorizontal size={11} className="text-gray-400" />
 <select value={sortOpt} onChange={e => setSortOpt(e.target.value)}
 className="text-xs font-medium text-gray-700 bg-white focus:outline-none border border-gray-200 rounded-lg px-2 py-1.5 max-w-[160px]">
 <option value="default">Popularity</option>
 <option value="low-high">Price: Low...High</option>
 <option value="high-low">Price: High...Low</option>
 <option value="savings">Discount</option>
 </select>
 </div>
 </div>

 {/* Products */}
 <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 lg:pb-4">
 {sorted.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-center py-16">
 <span className="text-4xl mb-3">??</span>
 <p className="text-sm font-medium text-gray-600">No Products Available</p>
 <p className="text-xs text-gray-400 mt-1">
 {pincode
 ? `No products in this category for pincode ${pincode}`
 : 'No products in this category yet'}
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-2 min-[481px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
 {sorted.map(p => <ProductCard key={p.id} product={p} />)}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
