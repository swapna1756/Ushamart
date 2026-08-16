import React from 'react';

export default function BrandName({ className = '', suffix = '' }) {
 return (
 <span className={`inline-flex items-baseline font-semibold tracking-normal ${className}`}>
 <span className="text-secondary">Usha</span>
 <span className="text-primary">Mart</span>
 {suffix && <span className="ml-1 text-inherit">{suffix}</span>}
 </span>
 );
}
