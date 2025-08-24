'use client';

import React from 'react';
import Image from 'next/image';

interface SpinningLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20', 
  lg: 'w-32 h-32',
  xl: 'w-40 h-40'
};

const speedClasses = {
  slow: 'animate-spin [animation-duration:3s]',
  normal: 'animate-spin [animation-duration:2s]',
  fast: 'animate-spin [animation-duration:1s]'
};

export function SpinningLogo({ 
  size = 'xl', 
  className = '', 
  speed = 'normal' 
}: SpinningLogoProps) {
  return (
    <div className={`${sizeClasses[size]} ${speedClasses[speed]} ${className}`}>
     <Image 
        src="/logo/ebrecho_logo.svg" 
        alt="eBrecho Logo" 
        width={400}
        height={400}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}

// Loading component with spinning logo and optional text
export function LoadingSpinner({ 
  text = 'Carregando...', 
  size = 'md',
  speed = 'normal' 
}: {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speed?: 'slow' | 'normal' | 'fast';
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <SpinningLogo size={size} speed={speed} />
      <p className="mt-4 text-gray-600 text-lg font-medium animate-pulse">
        {text}
      </p>
    </div>
  );
}
