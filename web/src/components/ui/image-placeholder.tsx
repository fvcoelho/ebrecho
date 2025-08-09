interface ImagePlaceholderProps {
  text?: string
  className?: string
}

export function ImagePlaceholder({ text = 'Imagem', className = '' }: ImagePlaceholderProps) {
  return (
    <div className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}>
      <span className="text-sm font-medium">{text}</span>
    </div>
  )
}