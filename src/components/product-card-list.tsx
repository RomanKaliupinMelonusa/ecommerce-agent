'use client';

import React from 'react';
import { ProductCard } from './product-card'; // Ensure this imports the Jewelry styled card
import type { UseChatHelpers } from '@ai-sdk/react';

// Updated interface for Jewelry Summary
interface JewelrySummary {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  currency?: string;
  metalType?: string;
}

interface ProductCardListProps {
  products: JewelrySummary[];
  append: UseChatHelpers['append'];
}

export function ProductCardList({ products, append }: ProductCardListProps) {
  if (!products || products.length === 0) {
    return <p className="text-gray-500 italic my-4 text-center">No matching items found.</p>;
  }

  // Added negative margin to counteract card margin for better alignment
  return (
    <div className="flex flex-wrap justify-center my-4 -mx-2">
      {products.map(product => (
        // Ensure ProductCard is the jewelry-styled one
        <ProductCard key={product.id} product={product} append={append} />
      ))}
    </div>
  );
}
