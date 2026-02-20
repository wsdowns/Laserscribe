function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-ls-surface border border-ls-border rounded-xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
