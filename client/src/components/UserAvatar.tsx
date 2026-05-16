import { useState } from 'react'

const SIZES = {
  sm: 'w-8 h-8 text-xs rounded-lg shadow-[0_2px_8px_rgba(124,58,237,0.4)]',
  md: 'w-9 h-9 text-sm rounded-xl shadow-[0_4px_12px_rgba(124,58,237,0.4)]',
  lg: 'w-16 h-16 text-2xl rounded-xl shadow-[0_4px_12px_rgba(124,58,237,0.4)]',
}

interface UserAvatarProps {
  src?: string
  name?: string
  size: 'sm' | 'md' | 'lg'
  className?: string
}

export default function UserAvatar({ src, name, size, className = '' }: UserAvatarProps) {
  const dim = SIZES[size]
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const [imgError, setImgError] = useState(false)

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        onError={() => setImgError(true)}
        className={`${dim} object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${dim} bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-black flex-shrink-0 ${className}`}
    >
      {initial}
    </div>
  )
}
