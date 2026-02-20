function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-ls-surface-hover text-ls-text-muted border-ls-border',
    accent: 'bg-ls-accent/15 text-ls-accent border-ls-accent/30',
    green: 'bg-ls-green/15 text-ls-green border-ls-green/30',
    blue: 'bg-ls-blue/15 text-ls-blue border-ls-blue/30',
    gold: 'bg-ls-gold/15 text-ls-gold border-ls-gold/30',
    red: 'bg-ls-red/15 text-ls-red border-ls-red/30',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
