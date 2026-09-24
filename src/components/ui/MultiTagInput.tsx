'use client'

import React, { useState, useRef, KeyboardEvent } from 'react'
import { X, Plus, Tag as TagIcon, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface MultiTagInputProps {
  value: string[] | string // Supports both string array or comma-separated string
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  label?: string
  className?: string
  maxTags?: number
}

// Paleta de colores armónicos NOVA para los tags
const TAG_COLOR_PALETTES = [
  'bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7]',
  'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]',
  'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]',
  'bg-[#EBF3FC] text-[#245D99] border-[#B9D5F3]',
  'bg-[#F3EDFA] text-[#6A389D] border-[#D6C2ED]',
  'bg-[#FDF2F0] text-[#944917] border-[#F2C0B8]',
]

export function getTagColorClass(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTES.length
  return TAG_COLOR_PALETTES[index]
}

export function MultiTagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Escribe un tag y presiona Enter...',
  label,
  className = '',
  maxTags = 10
}: MultiTagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Normalize value to array
  const currentTags: string[] = Array.isArray(value)
    ? value
    : (typeof value === 'string' && value.trim() ? value.split(',').map(s => s.trim()).filter(Boolean) : [])

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim()
    if (!clean) return
    if (currentTags.some(t => t.toLowerCase() === clean.toLowerCase())) {
      setInputValue('')
      return
    }
    if (currentTags.length >= maxTags) return

    const updated = [...currentTags, clean]
    onChange(updated)
    setInputValue('')
  }

  const handleRemoveTag = (indexToRemove: number) => {
    const updated = currentTags.filter((_, idx) => idx !== indexToRemove)
    onChange(updated)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && currentTags.length > 0) {
      e.preventDefault()
      handleRemoveTag(currentTags.length - 1)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    const isSelected = currentTags.some(t => t.toLowerCase() === suggestion.trim().toLowerCase())
    if (isSelected) {
      onChange(currentTags.filter(t => t.toLowerCase() !== suggestion.trim().toLowerCase()))
    } else {
      handleAddTag(suggestion)
    }
  }

  // Filter out suggestions that are already selected or match search
  const availableSuggestions = suggestions.filter(s => s && s.trim())

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#241C15] flex items-center gap-1.5">
            <TagIcon className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] text-[#75695D]">
            {currentTags.length}/{maxTags} tags
          </span>
        </div>
      )}

      {/* Input container with chips */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className="min-h-[42px] p-2 bg-[#FAF8F5] border border-[#E2D9CC] rounded-xl flex flex-wrap items-center gap-1.5 focus-within:bg-white focus-within:border-[#A36F4C] focus-within:ring-1 focus-within:ring-[#A36F4C] transition-all cursor-text"
      >
        {currentTags.map((tag, idx) => {
          const colorClass = getTagColorClass(tag)
          return (
            <span
              key={`${tag}-${idx}`}
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs transition-all ${colorClass}`}
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveTag(idx)
                }}
                className="hover:opacity-75 p-0.5 rounded-full cursor-pointer"
                title="Eliminar tag"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )
        })}

        {currentTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                handleAddTag(inputValue)
              }
            }}
            placeholder={currentTags.length === 0 ? placeholder : 'Agregar otro tag...'}
            className="flex-1 min-w-[140px] bg-transparent text-xs text-[#241C15] placeholder:text-[#75695D]/60 focus:outline-none py-1 px-1"
          />
        )}
      </div>

      {/* Sugerencias Rápidas */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-1 pt-0.5">
          <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider block">
            Sugerencias de Tags:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {availableSuggestions.slice(0, 12).map((sug) => {
              const isSelected = currentTags.some(t => t.toLowerCase() === sug.trim().toLowerCase())
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSuggestionClick(sug)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#241C15] text-white border-[#241C15] font-bold shadow-2xs'
                      : 'bg-[#FFFFFF] text-[#75695D] hover:text-[#241C15] hover:border-[#D4BEA7] border-[#E2D9CC]'
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  <span>{sug}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
