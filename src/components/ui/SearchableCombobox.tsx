'use client'

import React, { useState, useRef, useEffect, useMemo, useId } from 'react'
import { Search, ChevronDown, Check, X, Plus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxItem {
  id: string | number
  label: string
  sublabel?: string
  badge?: string
  badgeColor?: string
  icon?: LucideIcon
  disabled?: boolean
  metadata?: any
}

export interface SearchableComboboxProps {
  items: ComboboxItem[]
  value?: string | number
  onChange: (value: string, item?: ComboboxItem) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  allowCustomInput?: boolean
  onCustomCreate?: (text: string) => void
  customCreateLabel?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  name?: string
  id?: string
  required?: boolean
  icon?: LucideIcon
  size?: 'sm' | 'default' | 'lg'
  autoFocus?: boolean
  clearable?: boolean
}

export function SearchableCombobox({
  items,
  value,
  onChange,
  placeholder = 'Seleccionar opción...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  allowCustomInput = false,
  onCustomCreate,
  customCreateLabel = 'Agregar como nuevo:',
  disabled = false,
  className = '',
  inputClassName = '',
  id,
  required = false,
  icon: LeadingIcon = Search,
  size = 'default',
  clearable = true,
}: SearchableComboboxProps) {
  const generatedId = useId()
  const componentId = id || generatedId
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  // Find currently selected item
  const selectedItem = useMemo(() => {
    return items.find(item => String(item.id) === String(value) || item.label.toLowerCase() === String(value).toLowerCase())
  }, [items, value])

  // Sync display text with current value
  useEffect(() => {
    if (selectedItem) {
      setQuery(selectedItem.label)
    } else if (value && allowCustomInput) {
      setQuery(String(value))
    } else if (!value) {
      setQuery('')
    }
  }, [value, selectedItem, allowCustomInput])

  // Filter items in real time based on query
  const filteredItems = useMemo(() => {
    // If the query matches the selected item label (i.e. user just opened dropdown without typing a new search), show all items
    if (selectedItem && query.trim().toLowerCase() === selectedItem.label.trim().toLowerCase()) {
      return items
    }
    const cleanQuery = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (!cleanQuery) return items

    return items.filter(item => {
      const cleanLabel = item.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const cleanSublabel = item.sublabel ? item.sublabel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
      const cleanBadge = item.badge ? item.badge.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
      return cleanLabel.includes(cleanQuery) || cleanSublabel.includes(cleanQuery) || cleanBadge.includes(cleanQuery)
    })
  }, [items, query, selectedItem])

  // Reset highlighted index when filtered items change
  useEffect(() => {
    if (isOpen && selectedItem) {
      const idx = filteredItems.findIndex(i => String(i.id) === String(selectedItem.id))
      if (idx >= 0) {
        setHighlightedIndex(idx)
      } else {
        setHighlightedIndex(0)
      }
    } else {
      setHighlightedIndex(0)
    }
  }, [filteredItems, isOpen, selectedItem])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        // Reset query text to match selected item label if closed without selecting
        if (selectedItem) {
          setQuery(selectedItem.label)
        } else if (value && allowCustomInput) {
          setQuery(String(value))
        } else if (!value) {
          setQuery('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedItem, value, allowCustomInput])

  // Handle Item Select
  const handleSelectItem = (item: ComboboxItem) => {
    if (item.disabled) return
    setQuery(item.label)
    onChange(String(item.id), item)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Handle Custom Create
  const handleCreateCustom = () => {
    const trimmed = query.trim()
    if (!trimmed) return
    if (onCustomCreate) {
      onCustomCreate(trimmed)
    } else {
      onChange(trimmed)
    }
    setIsOpen(false)
  }

  // Handle Clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setQuery('')
    onChange('')
    inputRef.current?.focus()
    setIsOpen(true)
  }

  // Handle Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0))
        scrollHighlightedIntoView(highlightedIndex + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1))
        scrollHighlightedIntoView(highlightedIndex - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems.length > 0 && filteredItems[highlightedIndex]) {
          handleSelectItem(filteredItems[highlightedIndex])
        } else if (allowCustomInput && query.trim()) {
          handleCreateCustom()
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        if (selectedItem) setQuery(selectedItem.label)
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  const scrollHighlightedIntoView = (index: number) => {
    if (!listRef.current) return
    const el = listRef.current.children[index] as HTMLElement
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }

  // Sizing tokens with explicit non-conflicting padding
  const sizeClasses = {
    sm: 'h-9 text-xs rounded-xl pl-10 pr-12',
    default: 'min-h-[44px] h-11 text-sm rounded-xl pl-11 pr-14',
    lg: 'min-h-[48px] h-12 text-base rounded-xl pl-12 pr-16',
  }

  return (
    <div ref={containerRef} className={cn('relative w-full text-left select-none', className)}>
      {/* Search Input Container */}
      <div className="relative w-full flex items-center">
        {/* Leading Search / Package / Tag Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#75695D] flex items-center justify-center">
          <LeadingIcon className="h-5 w-5" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id={componentId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${componentId}-listbox`}
          value={query}
          disabled={disabled}
          required={required && !value}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true)
            // If the query matches the selected item label, select all text for easy replacement
            if (selectedItem && query === selectedItem.label) {
              inputRef.current?.select()
            }
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true)
            }
            if (selectedItem && query === selectedItem.label) {
              inputRef.current?.select()
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] font-medium shadow-sm transition-all outline-none truncate',
            'focus:border-[#A36F4C] focus:ring-2 focus:ring-[#A36F4C]/20 focus:bg-[#FFFFFF]',
            'disabled:opacity-50 disabled:bg-[#F4EFEA] disabled:cursor-not-allowed',
            sizeClasses[size],
            inputClassName
          )}
        />

        {/* Trailing Controls (Clear X + Chevron) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#75695D]">
          {clearable && query && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 rounded-lg text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              title="Limpiar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(prev => !prev)
                inputRef.current?.focus()
              }
            }}
            className="p-1 rounded-lg text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] transition-colors cursor-pointer"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180 text-[#A36F4C]')} />
          </button>
        </div>
      </div>

      {/* Floating Dropdown List (Z-50) */}
      {isOpen && (
        <div 
          id={`${componentId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#FFFFFF] border border-[#E2D9CC] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div ref={listRef} className="max-h-64 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
            {filteredItems.length === 0 ? (
              <div className="py-4 px-3 text-center space-y-2">
                <p className="text-xs text-[#75695D] font-medium">{emptyMessage}</p>
                {allowCustomInput && query.trim() && (
                  <button
                    type="button"
                    onClick={handleCreateCustom}
                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#F4FAF5] border border-[#B4E3C0] text-[#1E5E3A] text-xs font-bold hover:bg-[#EBF7EE] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{customCreateLabel} <strong className="font-mono">"{query.trim()}"</strong></span>
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = String(item.id) === String(value) || item.label.toLowerCase() === String(value).toLowerCase()
                const isHighlighted = index === highlightedIndex
                const ItemIcon = item.icon

                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all cursor-pointer select-none',
                      isSelected && 'bg-[#FDFBF7] text-[#A36F4C] font-bold border border-[#A36F4C]/30 shadow-xs',
                      isHighlighted && !isSelected && 'bg-[#F4EFEA] text-[#241C15]',
                      !isSelected && !isHighlighted && 'text-[#241C15] hover:bg-[#F4EFEA]',
                      item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {ItemIcon && (
                        <ItemIcon className={cn('h-4 w-4 flex-shrink-0', isSelected ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
                      )}
                      <div className="min-w-0 flex-1 flex flex-col">
                        <span className="truncate leading-tight">{item.label}</span>
                        {item.sublabel && (
                          <span className="text-[11px] text-[#75695D] font-normal truncate mt-0.5">{item.sublabel}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {item.badge && (
                        <span className={cn(
                          'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border',
                          item.badgeColor || 'bg-[#F4EFEA] border-[#DCD3C6] text-[#75695D]'
                        )}>
                          {item.badge}
                        </span>
                      )}

                      {isSelected && (
                        <Check className="h-4 w-4 text-[#A36F4C] stroke-[2.5]" />
                      )}
                    </div>
                  </div>
                )
              })
            )}

            {/* Quick add option if query does not exactly match any existing item */}
            {allowCustomInput && query.trim() && !filteredItems.some(i => i.label.toLowerCase() === query.trim().toLowerCase()) && filteredItems.length > 0 && (
              <button
                type="button"
                onClick={handleCreateCustom}
                className="w-full mt-1.5 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#F4FAF5] border border-[#B4E3C0] text-[#1E5E3A] text-xs font-bold hover:bg-[#EBF7EE] transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{customCreateLabel} <strong className="font-mono">"{query.trim()}"</strong></span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
