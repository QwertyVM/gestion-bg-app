'use client'

import React from 'react'
import type { ProductGroupRow } from './ProductsTableView'
import type { ProductoItem } from './CatalogoClient'
import { ProductCard } from './ProductCard'

export interface ProductCardGridProps {
  rows: ProductGroupRow[]
  allCatalogProductos?: ProductoItem[]
  onViewDetail: (group?: ProductGroupRow, single?: ProductoItem) => void
  onEdit: (product: ProductoItem) => void
  onEditGroup?: (group: ProductGroupRow) => void
  onDuplicar: (product: ProductoItem) => void
  onDuplicarGroup?: (group: ProductGroupRow) => void
  onDeleteProduct?: (product: ProductoItem) => void
  onDeleteGroup?: (group: ProductGroupRow) => void
  onToggleEstado?: (product: ProductoItem) => void
  onCopiarCotizacion?: (product: ProductoItem) => void
  formatCurrency: (val: number) => string
  calcMargen: (precio: number, costo: number) => string
  copiedId?: string | null
}

export function ProductCardGrid({
  rows,
  onViewDetail,
  onEdit,
  onEditGroup,
  onDuplicar,
  onDuplicarGroup,
  onDeleteProduct,
  onDeleteGroup,
  onToggleEstado,
  onCopiarCotizacion,
  formatCurrency,
  calcMargen,
  copiedId
}: ProductCardGridProps) {
  if (rows.length === 0) {
    return (
      <div className="w-full bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground italic text-xs shadow-xs my-4">
        No se encontraron juegos con ese criterio de búsqueda
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 my-4 animate-in fade-in-50 duration-200">
      {rows.map((row) => (
        <ProductCard
          key={row.id}
          row={row}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onEditGroup={onEditGroup}
          onDuplicar={onDuplicar}
          onDuplicarGroup={onDuplicarGroup}
          onDeleteProduct={onDeleteProduct}
          onDeleteGroup={onDeleteGroup}
          onToggleEstado={onToggleEstado}
          onCopiarCotizacion={onCopiarCotizacion}
          formatCurrency={formatCurrency}
          calcMargen={calcMargen}
          copiedId={copiedId}
        />
      ))}
    </div>
  )
}
