import React from 'react';

interface UshaMartLogoProps {
  className?: string;
}

export function UshaMartLogo({ className = "" }: UshaMartLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-1 bg-white ${className}`}>
      <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&q=80" alt="UshaMart Premium Grocery" className="max-w-full h-auto object-contain rounded-lg" />
    </div>
  );
}

export function getCategoryImage(catName: string, catIcon?: string): string {
  if (catIcon && typeof catIcon === 'string' && catIcon.trim() !== '' && !catIcon.includes('loremflickr.com')) {
    return catIcon;
  }
  const name = (catName || '').toLowerCase().trim();
  if (name.includes('vegetable')) {
    return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=150&q=80';
  }
  if (name.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=150&q=80';
  }
  if (name.includes('dairy') || name.includes('milk') || name.includes('butter') || name.includes('cheese')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80';
  }
  if (name.includes('bread') || name.includes('bakery')) {
    return 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=150&q=80';
  }
  if (name.includes('beverage') || name.includes('drink') || name.includes('juice') || name.includes('soda')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&q=80';
  }
  if (name.includes('snack') || name.includes('chip') || name.includes('cookie') || name.includes('biscuit')) {
    return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80';
  }
  if (name.includes('rice') || name.includes('atta') || name.includes('flour') || name.includes('grain')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&q=80';
  }
  if (name.includes('oil') || name.includes('ghee') || name.includes('cooking')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&q=80';
  }
  if (name.includes('clean') || name.includes('detergent') || name.includes('soap')) {
    return 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=150&q=80';
  }
  if (name.includes('personal') || name.includes('body') || name.includes('shampoo')) {
    return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80';
  }
  if (name.includes('household') || name.includes('kitchen') || name.includes('appl')) {
    return 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=150&q=80';
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80';
}

export function getProductImage(prodName: string, prodImages?: string[]): string {
  if (prodImages && prodImages.length > 0 && prodImages[0] && !prodImages[0].includes('loremflickr.com')) {
    return prodImages[0];
  }
  const name = (prodName || '').toLowerCase().trim();
  if (name.includes('apple')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=150&q=80';
  }
  if (name.includes('broccoli')) {
    return 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&q=80';
  }
  if (name.includes('tomato')) {
    return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=150&q=80';
  }
  if (name.includes('banana')) {
    return 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=150&q=80';
  }
  if (name.includes('milk') || name.includes('dairy') || name.includes('ghee') || name.includes('butter')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80';
  }
  if (name.includes('bread') || name.includes('bakery')) {
    return 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=150&q=80';
  }
  if (name.includes('chips') || name.includes('snack') || name.includes('cookie') || name.includes('biscuit')) {
    return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80';
  }
  if (name.includes('juice') || name.includes('coke') || name.includes('drink') || name.includes('beverage')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&q=80';
  }
  if (name.includes('rice') || name.includes('atta') || name.includes('flour') || name.includes('dal')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&q=80';
  }
  if (name.includes('cooker') || name.includes('fryer') || name.includes('appl')) {
    return 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&q=80';
  }
  if (name.includes('gel') || name.includes('cleaner') || name.includes('detergent')) {
    return 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=150&q=80';
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80';
}
