interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const variantClasses = {
  primary: 'bg-accent hover:bg-accent/80 text-white',
  ghost: 'bg-transparent hover:bg-surface text-text-muted hover:text-text-primary border border-border',
  danger: 'bg-error/20 hover:bg-error/30 text-error',
}

const sizeClasses = { sm: 'px-2 py-1 text-xs', md: 'px-4 py-2 text-sm' }

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: Props) {
  return (
    <button
      className={`rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}
