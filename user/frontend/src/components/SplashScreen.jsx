import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BrandName from './BrandName';

const KF = `
 @keyframes um-spin {
 to { transform: rotate(360deg); }
 }
 @keyframes um-pulse-ring {
 0% { transform: translate(-50%,-50%) scale(0.85); opacity: 0.6; }
 100% { transform: translate(-50%,-50%) scale(1.55); opacity: 0; }
 }
 @keyframes um-float {
 0%, 100% { transform: translateY(0px); }
 50% { transform: translateY(-9px); }
 }
 @keyframes um-shimmer {
 0% { background-position: -300px 0; }
 100% { background-position: 300px 0; }
 }
 @keyframes um-orbit {
 from { transform: rotate(0deg) translateX(var(--r)) rotate(0deg); }
 to { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); }
 }
`;

const DOTS = [
 { id: 1, color: '#0B6F3A', size: 8, r: 110, dur: 7, delay: 0 },
 { id: 2, color: '#4CAF50', size: 6, r: 120, dur: 9, delay: -3 },
 { id: 3, color: '#EE4224', size: 7, r: 105, dur: 11, delay: -5 },
 { id: 4, color: '#FFC107', size: 5, r: 118, dur: 8, delay: -2 },
 { id: 5, color: '#2196F3', size: 6, r: 112, dur: 10, delay: -7 },
 { id: 6, color: '#9C27B0', size: 5, r: 122, dur: 12, delay: -4 },
];

const WORDS = ['Groceries', 'Freshness', 'Quality', 'Speed'];

export default function SplashScreen({ onFinish }) {
 const [wordIdx, setWordIdx] = useState(0);

 useEffect(() => {
 const id = 'um-kf';
 if (!document.getElementById(id)) {
 const s = document.createElement('style');
 s.id = id;
 s.textContent = KF;
 document.head.appendChild(s);
 }
 }, []);

 useEffect(() => {
 const t = setInterval(() => setWordIdx(i => (i + 1) % WORDS.length), 700);
 return () => clearInterval(t);
 }, []);

 useEffect(() => {
 const t = setTimeout(() => {
 if (onFinish) onFinish();
 }, 2500);
 return () => clearTimeout(t);
 }, [onFinish]);

 return (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.4 }}
 style={{
 position: 'fixed',
 inset: 0,
 zIndex: 9999,
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 background: 'linear-gradient(160deg, #ffffff 0%, #f9fdf9 40%, #f0faf4 100%)',
 userSelect: 'none',
 overflow: 'hidden',
 }}
 >
 <div style={{
 position: 'absolute', top: '-80px', right: '-60px',
 width: '260px', height: '260px', borderRadius: '50%',
 background: 'radial-gradient(circle, rgba(11,111,58,0.07) 0%, transparent 70%)',
 pointerEvents: 'none',
 }} />
 <div style={{
 position: 'absolute', bottom: '-100px', left: '-80px',
 width: '300px', height: '300px', borderRadius: '50%',
 background: 'radial-gradient(circle, rgba(76,175,80,0.06) 0%, transparent 70%)',
 pointerEvents: 'none',
 }} />

 {[1, 2, 3].map(i => (
 <motion.div
 key={i}
 initial={{ scale: 0.8, opacity: 0.5 }}
 animate={{ scale: 1.6, opacity: 0 }}
 transition={{ duration: 2.2, delay: i * 0.55, repeat: Infinity, ease: 'easeOut' }}
 style={{
 position: 'absolute',
 width: '180px',
 height: '180px',
 borderRadius: '50%',
 border: `1.5px solid rgba(11,111,58,${0.22 - i * 0.05})`,
 pointerEvents: 'none',
 }}
 />
 ))}

 {DOTS.map(d => (
 <div
 key={d.id}
 style={{
 position: 'absolute',
 width: d.size,
 height: d.size,
 borderRadius: '50%',
 background: d.color,
 boxShadow: `0 0 8px ${d.color}88`,
 '--r': `${d.r}px`,
 animation: `um-orbit ${d.dur}s linear ${d.delay}s infinite`,
 opacity: 0.75,
 pointerEvents: 'none',
 }}
 />
 ))}

 <motion.div
 initial={{ scale: 0.6, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275], delay: 0.15 }}
 style={{
 position: 'relative',
 zIndex: 10,
 animation: 'um-float 3.5s ease-in-out 1s infinite',
 }}
 >
 <div style={{
 position: 'absolute',
 inset: '-20px',
 borderRadius: '50px',
 background: 'radial-gradient(ellipse, rgba(11,111,58,0.18) 0%, transparent 65%)',
 filter: 'blur(12px)',
 pointerEvents: 'none',
 }} />

 <div
 style={{
 width: '150px',
 height: '150px',
 borderRadius: '32px',
 background: '#ffffff',
 boxShadow: [
 '0 20px 60px rgba(11,111,58,0.18)',
 '0 8px 24px rgba(0,0,0,0.10)',
 '0 0 0 1px rgba(11,111,58,0.08)',
 'inset 0 1px 0 rgba(255,255,255,1)',
 ].join(', '),
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 padding: '20px',
 position: 'relative',
 overflow: 'hidden',
 }}
 >
 <div style={{
 position: 'absolute',
 inset: 0,
 background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
 backgroundSize: '300px 100%',
 backgroundRepeat: 'no-repeat',
 animation: 'um-shimmer 2.4s ease-in-out 0.6s infinite',
 borderRadius: '32px',
 pointerEvents: 'none',
 }} />

 <img
 src="/logo.png"
 alt="UshaMart"
 style={{
 width: '100%',
 height: '100%',
 objectFit: 'contain',
 position: 'relative',
 zIndex: 1,
 }}
 />
 </div>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.55, delay: 0.65, ease: 'easeOut' }}
 style={{ textAlign: 'center', marginTop: '28px', zIndex: 10, padding: '0 32px' }}
 >
 <BrandName size="2xl" as="h1" className="block mb-1" />
 <p style={{
 fontSize: '14px',
 fontWeight: '500',
 color: '#334155',
 margin: 0,
 }}>
 Fresh Groceries Delivered
 </p>

 <div style={{ height: '28px', overflow: 'hidden', marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
 <motion.span
 key={wordIdx}
 initial={{ y: 22, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: -22, opacity: 0 }}
 transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
 style={{
 display: 'inline-block',
 fontSize: '12px',
 fontWeight: '500',
 color: '#0B6F3A',
 background: 'linear-gradient(135deg, #E7F5ED, #c8ead6)',
 padding: '4px 14px',
 borderRadius: '20px',
 letterSpacing: '0.02em',
 border: '1px solid rgba(11,111,58,0.15)',
 }}
 >
 {WORDS[wordIdx]}
 </motion.span>
 </div>
 </motion.div>

 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.9, duration: 0.4 }}
 style={{
 position: 'absolute',
 bottom: '48px',
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 gap: '10px',
 zIndex: 10,
 }}
 >
 <div style={{
 width: '26px',
 height: '26px',
 borderRadius: '50%',
 border: '2.5px solid rgba(11,111,58,0.15)',
 borderTop: '2.5px solid #0B6F3A',
 animation: 'um-spin 0.85s linear infinite',
 }} />

 <p style={{
 fontSize: '11px',
 fontWeight: '500',
 color: '#64748b',
 letterSpacing: '0.04em',
 margin: 0,
 }}>
 Loading <BrandName size="xs" />…
 </p>
 </motion.div>
 </motion.div>
 );
}
