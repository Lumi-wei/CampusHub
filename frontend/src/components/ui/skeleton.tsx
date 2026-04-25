import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ width = '100%', height = '16px', className = '', rounded = true }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-[#D1DDE8] shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <Skeleton width="80px" height="12px" className="mb-3" />
          <Skeleton width="120px" height="24px" className="mb-2" />
          <Skeleton width="160px" height="12px" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-100 ml-2" />
      </div>
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="bg-[#1E3A5F] rounded-2xl p-6 text-white">
      <Skeleton width="120px" height="20px" className="mb-3" />
      <Skeleton width="200px" height="14px" className="mb-4" />
      <div className="flex gap-3">
        <Skeleton width="100px" height="32px" rounded />
        <Skeleton width="100px" height="32px" rounded />
      </div>
    </div>
  );
}

export function SkeletonQuickCard() {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-[#D1DDE8]">
      <div className="w-8 h-8 rounded-full bg-gray-200" />
      <div className="flex-1">
        <Skeleton width="120px" height="14px" className="mb-1" />
        <Skeleton width="160px" height="12px" />
      </div>
      <div className="w-4 h-4 bg-gray-200 rounded" />
    </div>
  );
}

export function SkeletonFeatureCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#D1DDE8] shadow-sm">
      <div className="w-12 h-12 rounded-full bg-gray-200 mb-3" />
      <Skeleton width="100px" height="16px" className="mb-2" />
      <Skeleton width="160px" height="12px" className="mb-2" />
      <Skeleton width="80px" height="12px" />
      <div className="mt-3 flex items-center gap-1">
        <Skeleton width="60px" height="12px" />
        <div className="w-3 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl border border-[#D1DDE8] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#D1DDE8]">
        <Skeleton width="120px" height="18px" />
      </div>
      <div className="divide-y divide-[#D1DDE8]">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="p-4">
            <Skeleton width="100px" height="14px" className="mb-2" />
            <Skeleton width="160px" height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}