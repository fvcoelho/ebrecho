'use client'

import { ShoppingBag } from 'lucide-react'
import { useState } from 'react'

interface ShoppingBagIconProps {
  productId: string
  className?: string
}

export function ShoppingBagIcon({ productId, className = '' }: ShoppingBagIconProps) {
  // Generate a random count for demo purposes
  // In real implementation, this would come from a shopping cart context
  const [count] = useState(() => Math.floor(Math.random() * 20) + 1)
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // In real implementation, this would add to cart
    console.log('Add to cart:', productId)
  }
  
  return (
    <div 
      className={`bg-purple-600 text-white rounded-full p-2 relative cursor-pointer hover:bg-purple-700 transition-colors ${className}`}
      onClick={handleClick}
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="absolute -top-1 -right-1 bg-purple-800 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
        {count}
      </span>
    </div>
  )
}