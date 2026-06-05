// Deterministic avatar colors derived from a name, so the same name always
// renders the same background. Used for initial-letter fallback avatars.

function hashHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

/** A CSS gradient string keyed off the name (white initial reads well on it). */
export function avatarGradient(name?: string): string {
  const hue = hashHue(name && name.trim() ? name : '?')
  return `linear-gradient(135deg, hsl(${hue} 68% 55%), hsl(${(hue + 28) % 360} 72% 46%))`
}

/** First letter of a name, uppercased; falls back to '?'. */
export function avatarInitial(name?: string): string {
  return name?.trim()?.charAt(0)?.toUpperCase() || '?'
}
