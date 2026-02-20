function Button({ children, variant = 'default', size = 'default', className = '', ...props }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ls-accent focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variants = {
    default: 'bg-ls-accent text-white hover:bg-ls-accent-dark shadow-lg shadow-ls-accent-glow',
    outline: 'border-2 border-ls-accent text-ls-accent bg-transparent hover:bg-ls-accent hover:text-white',
    ghost: 'text-ls-text-muted hover:bg-ls-surface-hover hover:text-ls-text',
    danger: 'bg-ls-red text-white hover:bg-ls-red/80',
    gold: 'bg-ls-gold text-ls-dark font-bold hover:bg-ls-gold/90',
  }

  const sizes = {
    default: 'h-11 px-5 py-2 text-sm',
    sm: 'h-9 px-4 text-xs',
    lg: 'h-12 px-8 text-base',
    icon: 'h-10 w-10',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
