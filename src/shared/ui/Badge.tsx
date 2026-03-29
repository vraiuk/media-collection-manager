type BadgeVariant = 'default' | 'uploading' | 'error' | 'success' | 'image' | 'video' | 'document'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface text-text-muted',
  uploading: 'bg-accent/20 text-accent',
  error: 'bg-error/20 text-error',
  success: 'bg-success/20 text-success',
  image: 'bg-blue-500/20 text-blue-400',
  video: 'bg-purple-500/20 text-purple-400',
  document: 'bg-orange-500/20 text-orange-400',
}

interface Props {
  label: string
  variant?: BadgeVariant
}

export function Badge({ label, variant = 'default' }: Props) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${variantClasses[variant]}`}>
      {label}
    </span>
  )
}
