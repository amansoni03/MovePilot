"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const MapComponentNoSSR = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[350px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-semibold border border-slate-200">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading Interactive GPS Map...</span>
        </div>
      </div>
    )
  }
);

export const LiveMap: React.FC = () => {
  return <MapComponentNoSSR />;
};
