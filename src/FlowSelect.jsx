import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function FlowSelect({ label, value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef(null)
  const listId = useId()
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value))
  const selected = options[selectedIndex] || options[0]

  useEffect(() => {
    if (!open) return undefined
    setHighlighted(selectedIndex)
    const closeOutside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open, selectedIndex])

  const choose = option => {
    onChange(option.value)
    setOpen(false)
  }

  const handleKeyDown = event => {
    if (disabled) return
    if (event.key === 'Escape') { setOpen(false); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) { setOpen(true); return }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setHighlighted(index => (index + direction + options.length) % options.length)
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setOpen(true)
      setHighlighted(event.key === 'Home' ? 0 : options.length - 1)
      return
    }
    if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault()
      choose(options[highlighted])
    }
  }

  return <div className={`flow-select-field ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={rootRef}>
    <span className="flow-select-label">{label}</span>
    <button
      type="button"
      className="flow-select-trigger"
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-label={label}
      disabled={disabled}
      onClick={() => setOpen(current => !current)}
      onKeyDown={handleKeyDown}
    >
      <span><strong>{selected?.label}</strong>{selected?.short && <small>{selected.short}</small>}</span>
      <ChevronDown size={17}/>
    </button>
    {open && <div className="flow-select-popover" id={listId} role="listbox" aria-label={`${label} options`}>
      {options.map((option, index) => <button
        type="button"
        role="option"
        aria-selected={option.value === value}
        className={`${option.value === value ? 'selected' : ''} ${index === highlighted ? 'highlighted' : ''}`}
        onPointerMove={() => setHighlighted(index)}
        onClick={() => choose(option)}
        key={option.value}
      >
        <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        <Check size={16}/>
      </button>)}
    </div>}
  </div>
}
