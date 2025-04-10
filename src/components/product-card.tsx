'use client';

import React from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import Image from 'next/image';

// Updated interface for Jewelry Summary
interface JewelrySummary {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  currency?: string;
  metalType?: string; // Added jewelry-specific field
}

interface ProductCardProps {
  product: JewelrySummary;
  append: UseChatHelpers['append'];
}

export function ProductCard({ product, append }: ProductCardProps) {

  const handleGetDetails = () => {
    append({
      role: 'user',
      content: `Show me details for item ID ${product.id} (${product.name})`,
    });
  };

  return (
    // Restyled card: lighter background, subtle shadow, gold/neutral accents
    <div className="border border-gray-200 rounded-lg p-4 m-2 shadow-sm flex flex-col items-center text-center bg-white max-w-xs transition-shadow hover:shadow-md">
      <div className="w-36 h-36 mb-4 relative">
        {product.imageUrl ? (
          <Image
        src={product.imageUrl}
        alt={product.name}
        fill
        className="object-contain rounded"
        sizes="(max-width: 640px) 100vw, 36rem"
          />
        ) : null}
      </div>
      <h3 className="font-serif font-medium text-lg mb-1 text-gray-800">{product.name}</h3>
      {/* Display metal type if available */}
      {product.metalType && (
          <p className="text-sm text-gray-500 mb-2">{product.metalType}</p>
      )}
      <p className="text-gray-700 mb-4 font-sans">
        {product.price.toLocaleString(undefined, { style: 'currency', currency: product.currency || 'USD' })}
      </p>
      {/* Restyled button: gold accent, slightly smaller text */}
      <button
        onClick={handleGetDetails}
        className="mt-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-full text-xs tracking-wide transition-colors"
      >
        View Details
      </button>
    </div>
  );
}
