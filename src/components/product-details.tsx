 'use client';

import React from 'react';
import Image from 'next/image';

// Updated interface for Jewelry Details
interface JewelryDetailsData {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  currency?: string;
  metalType?: string;
  description: string;
  stock: number;
  stoneType?: string;
  caratWeight?: number;
  specifications: Record<string, string>;
}

export function ProductDetails({ details }: { details: JewelryDetailsData }) {
  if (!details?.id) {
    return <p className="text-red-600 italic my-4 text-center">Could not display item details.</p>;
  }

  // Configuration for details width (example)
  const detailsMaxWidthClass = 'max-w-3xl'; // Changed from max-w-lg to make it wider

  return (
    // Restyled details view: softer background, more padding, elegant fonts
    <div className={`border border-gray-200 rounded-lg p-6 m-2 shadow-lg bg-gradient-to-br from-white to-gray-50 ${detailsMaxWidthClass} my-4 font-serif`}>
      <h2 className="text-3xl font-medium text-gray-800 mb-5 text-center">{details.name}</h2>
      <div className="flex flex-col md:flex-row gap-8 mb-6 items-center">
        <div className="w-52 h-52 relative rounded-md border border-gray-200 shadow-sm flex-shrink-0">
          <Image
            src={details.imageUrl || null}
            alt={details.name}
            fill
            className="object-contain rounded-md"
            sizes="(max-width: 768px) 100vw, 13rem"
          />
        </div>
        <div className="flex-grow font-sans">
          <p className="text-2xl text-amber-700 mb-3">
            {details.price.toLocaleString(undefined, { style: 'currency', currency: details.currency || 'USD' })}
          </p>
          {/* Display stock status */}
          <p className={`mb-4 text-sm font-semibold ${details.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
            {details.stock > 0 ? `In Stock (${details.stock} available)` : 'Currently Unavailable'}
          </p>
          <p className="text-gray-600 text-base leading-relaxed mb-4">{details.description}</p>
          {/* Display Jewelry Specific fields */}
          {details.metalType && <p className="text-sm text-gray-600"><span className="font-semibold">Metal:</span> {details.metalType}</p>}
          {details.stoneType && <p className="text-sm text-gray-600"><span className="font-semibold">Stone:</span> {details.stoneType}</p>}
          {details.caratWeight !== undefined && <p className="text-sm text-gray-600"><span className="font-semibold">Carat Weight:</span> {details.caratWeight.toFixed(2)} ct</p>}

        </div>
      </div>
      {/* Display Specifications */}
      {Object.keys(details.specifications || {}).length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-200">
          <h4 className="font-semibold mb-3 text-lg text-gray-700">Specifications:</h4>
          <ul className="list-none space-y-1 text-sm text-gray-600 font-sans">
            {Object.entries(details.specifications).map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span className="font-medium text-gray-800">{key}:</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
