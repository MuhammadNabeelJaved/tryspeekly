const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-16 h-16 text-2xl',
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

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} rounded-xl object-cover flex-shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.4)] ${className}`}
      />
    )
  }

  return (
    <div
      className={`${dim} rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-black flex-shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.4)] ${className}`}
    >
      {initial}
    </div>
  )
}
