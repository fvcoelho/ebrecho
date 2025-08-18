'use client'

import React from 'react'
import Image from 'next/image'

interface SpinningLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'green' | 'red' | 'gray' | 'white'
  showText?: boolean
  text?: string
  className?: string
}

const SpinningLogo: React.FC<SpinningLogoProps> = ({
  size = 'md',
  color = 'blue',
  showText = false,
  text = '',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {/* Spinning Logo */}
      <div className={`relative ${sizeClasses[size]} animate-spin`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* Simplified version of the eBrecho logo optimized for spinning */}
          <g className="animate-pulse">
            {/* Red circle */}
            <circle cx="30" cy="45" r="15" fill="#FF4444" opacity="0.9"/>
            {/* Yellow circle */}
            <circle cx="60" cy="30" r="12" fill="#FFD700" opacity="0.8"/>
            {/* Blue circle */}
            <circle cx="52" cy="60" r="11" fill="#4169E1" opacity="0.8"/>
            {/* Green circle */}
            <circle cx="78" cy="45" r="13" fill="#32CD32" opacity="0.8"/>
            
            {/* Connection lines that pulse */}
            <line x1="30" y1="45" x2="60" y2="30" stroke="#666" strokeWidth="1.5" opacity="0.4"/>
            <line x1="30" y1="45" x2="52" y2="60" stroke="#666" strokeWidth="1.5" opacity="0.4"/>
            <line x1="60" y1="30" x2="78" y2="45" stroke="#666" strokeWidth="1.5" opacity="0.4"/>
            <line x1="52" y1="60" x2="78" y2="45" stroke="#666" strokeWidth="1.5" opacity="0.4"/>
          </g>
        </svg>
      </div>

      {/* Text */}
      {showText && text && (
        <div className={`text-center ${colorClasses[color]}`}>
          <p className="text-sm font-medium animate-pulse">{text}</p>
        </div>
      )}
    </div>
  )
}

export default SpinningLogo