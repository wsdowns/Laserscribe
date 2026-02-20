function Input({ label, id, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ls-text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full h-11 px-4 bg-ls-surface border border-ls-border rounded-lg text-ls-text placeholder:text-ls-text-muted/50 focus:outline-none focus:ring-2 focus:ring-ls-accent focus:border-transparent transition-all ${className}`}
        {...props}
      />
    </div>
  )
}

export default Input
