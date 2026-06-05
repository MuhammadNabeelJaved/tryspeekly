import { useState } from 'react'

import { avatarGradient } from '@/utils/avatarColor'

const SIZES = {
  xs: 'w-6 h-6 text-[10px] rounded-md',
  sm: 'w-8 h-8 text-xs rounded-lg shadow-[0_2px_8px_rgba(124,58,237,0.4)]',
  md: 'w-9 h-9 text-sm rounded-xl shadow-[0_4px_12px_rgba(124,58,237,0.4)]',
  lg: 'w-16 h-16 text-2xl rounded-xl shadow-[0_4px_12px_rgba(124,58,237,0.4)]',
}

interface UserAvatarProps {
  src?: string
  name?: string
  size: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  /** When true, the initial-letter fallback uses a color derived from `name`. */
  colorFromName?: boolean
}

export default function UserAvatar({
  src,
  name,
  size,
  className = '',
  colorFromName = false,
}: UserAvatarProps) {
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
      style={colorFromName ? { background: avatarGradient(name) } : undefined}
      className={
        `${dim} flex items-center justify-center text-white font-black flex-shrink-0 ` +
        `${colorFromName ? '' : 'bg-gradient-to-br from-violet-600 to-purple-600'} ${className}`
      }
    >
      {initial}
    </div>
  )
}
