import { useState, useRef, useEffect } from 'react'

function Select({ value, onValueChange, placeholder = 'Select...', label, id, children }) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const ref = useRef(null)

  const childArray = Array.isArray(children) ? children : children ? [children] : []

  const selectedOption = childArray.find(
    (child) => child?.props?.value === value
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open && focusedIndex >= 0) {
          const child = childArray[focusedIndex]
          if (child) {
            onValueChange(child.props.value)
            setOpen(false)
          }
        } else {
          setOpen(!open)
        }
        break
      case 'Escape':
        setOpen(false)
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!open) {
          setOpen(true)
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, childArray.length - 1))
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        break
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ls-text-muted">
          {label}
        </label>
      )}
      <div className="relative" ref={ref}>
        <button
          type="button"
          id={id}
          onClick={() => setOpen(!open)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center justify-between w-full h-11 px-4 bg-ls-surface border border-ls-border rounded-lg text-left hover:border-ls-accent focus:ring-2 focus:ring-ls-accent focus:outline-none transition-all cursor-pointer"
        >
          <span className={selectedOption ? 'text-ls-text' : 'text-ls-text-muted/50'}>
            {selectedOption ? selectedOption.props.children : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-ls-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <ul
            role="listbox"
            className="absolute z-50 w-full mt-2 max-h-60 overflow-auto bg-ls-surface border border-ls-border rounded-lg shadow-xl"
          >
            {childArray.map((child, index) => (
              <li
                key={child.props.value}
                role="option"
                aria-selected={child.props.value === value}
                className={`px-4 py-2.5 cursor-pointer transition-colors ${
                  child.props.value === value
                    ? 'bg-ls-accent text-white'
                    : index === focusedIndex
                    ? 'bg-ls-surface-hover text-ls-text'
                    : 'text-ls-text hover:bg-ls-surface-hover'
                }`}
                onClick={() => {
                  onValueChange(child.props.value)
                  setOpen(false)
                }}
              >
                {child.props.children}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SelectItem({ value, children }) {
  return <div data-value={value}>{children}</div>
}

export { Select, SelectItem }
