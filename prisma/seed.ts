import { PrismaClient, CategoriaInversion, EstadoVenta, TipoPrecio } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Restaurando data completa al estado de ayer a las 10:29 PM...')

  // Limpieza en orden estricto de claves foráneas
  await prisma.cierreMes.deleteMany()
  await prisma.venta.deleteMany()
  await prisma.producto.deleteMany()
  await prisma.categoria.deleteMany()
  await prisma.inversion.deleteMany()
  await prisma.tagInsumo.deleteMany()
  await prisma.ingreso.deleteMany()

  // 1. Tags de Insumos completos (incluyendo Herramientas & Taller y Otros)
  const tagsBase = [
    { nombre: 'Filamento PLA', descripcion: 'Bobinas y refills de filamento PLA para impresión 3D', color: 'blue', categoria: 'INSUMO' },
    { nombre: 'Packaging & Envíos', descripcion: 'Cajas de cartón, cinta de embalaje, plástico burbuja y stickers', color: 'amber', categoria: 'INSUMO' },
    { nombre: 'Maquinaria & Repuestos', descripcion: 'Impresoras 3D, secadores, boquillas, placas y repuestos', color: 'purple', categoria: 'ACTIVO_FIJO' },
    { nombre: 'Herramientas & Taller', descripcion: 'Soplete, encendedores, bisturí, alicates y herramientas de acabado', color: 'amber', categoria: 'ACTIVO_FIJO' },
    { nombre: 'Publicidad & Marketing', descripcion: 'Campañas de anuncios Meta / Instagram Ads y contenido', color: 'pink', categoria: 'SERVICIO' },
    { nombre: 'Logística & Envíos', descripcion: 'Movilidad local, servicios Olva / Shalom y taxis express', color: 'purple', categoria: 'SERVICIO' },
    { nombre: 'Otros', descripcion: 'Gastos operativos y suministros generales', color: 'indigo', categoria: 'INSUMO' },
  ]

  for (const tag of tagsBase) {
    await prisma.tagInsumo.create({ data: tag })
  }

  // 2. Inversiones / Egresos (Estado completo a las 10:29 PM con Soplete, Encendedor, Papel film, etc.)
  const fechaEgreso = new Date('2026-08-28T22:20:00Z')
  await prisma.inversion.createMany({
    data: [
      // Maquinaria & Activo Fijo Principal
      { persona: 'Víctor', categoria: CategoriaInversion.ACTIVO_FIJO, subcategoria: 'Maquinaria & Repuestos', itemConcepto: 'Impresora 3D', especificacionColor: 'Equipo Principal', presentacion: 'Unidad', cantidad: 1, costoUnitario: 2099, costoEnvio: 0, costoTotal: 2099, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.ACTIVO_FIJO, subcategoria: 'Maquinaria & Repuestos', itemConcepto: 'Secador de Filamento TwoTrees', especificacionColor: 'Secador de Filamento', presentacion: 'Unidad', cantidad: 1, costoUnitario: 240, costoEnvio: 0, costoTotal: 240, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.ACTIVO_FIJO, subcategoria: 'Maquinaria & Repuestos', itemConcepto: 'Separa bambu lab A2L', especificacionColor: 'Separador / Accesorio', presentacion: 'Unidad', cantidad: 1, costoUnitario: 45, costoEnvio: 0, costoTotal: 45, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.ACTIVO_FIJO, subcategoria: 'Maquinaria & Repuestos', itemConcepto: 'Maquinaria mas filamentos', especificacionColor: 'Combo taller', presentacion: 'Pack', cantidad: 1, costoUnitario: 150, costoEnvio: 0, costoTotal: 150, createdAt: fechaEgreso },
      
      // Herramientas & Taller (Registros de las 10:29 PM)
      { persona: 'Víctor', categoria: CategoriaInversion.ACTIVO_FIJO, subcategoria: 'Herramientas & Taller', itemConcepto: 'Soplete', especificacionColor: 'Gas butano / Post-procesado 3D', presentacion: 'Unidad', cantidad: 1, costoUnitario: 35, costoEnvio: 0, costoTotal: 35, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Herramientas & Taller', itemConcepto: 'Encendedor', especificacionColor: 'Recargable', presentacion: 'Unidad', cantidad: 1, costoUnitario: 8, costoEnvio: 0, costoTotal: 8, createdAt: fechaEgreso },
      
      // Insumos / Filamentos
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA', especificacionColor: 'Color Mate', presentacion: 'Bobina 1Kg', cantidad: 1, costoUnitario: 75.59, costoEnvio: 0, costoTotal: 75.59, costoPorGramo: 0.0756, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA', especificacionColor: 'Negro', presentacion: 'Bobina 1Kg', cantidad: 1, costoUnitario: 75.59, costoEnvio: 0, costoTotal: 75.59, costoPorGramo: 0.0756, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA', especificacionColor: 'Verde Agua', presentacion: 'Bobina 1Kg', cantidad: 1, costoUnitario: 75.59, costoEnvio: 0, costoTotal: 75.59, costoPorGramo: 0.0756, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Blanco Hueso', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 7, costoTotal: 67, costoPorGramo: 0.067, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Carbón', presentacion: 'Con Bobina Reutilizable (BR) 1Kg', cantidad: 1, costoUnitario: 79, costoEnvio: 7, costoTotal: 86, costoPorGramo: 0.086, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Gris Ceniza', presentacion: 'Con Bobina Reutilizable (BR) 1Kg', cantidad: 1, costoUnitario: 79, costoEnvio: 7, costoTotal: 86, costoPorGramo: 0.086, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Blanco Hueso', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Charcoal', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Gris Ceniza', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Lila Púrpura', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Naranja Mandarina', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Rojo Escarlata', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D PLA Matte Bambu Lab', especificacionColor: 'Verde Grass', presentacion: 'Sin bobina (Refill) 1Kg', cantidad: 1, costoUnitario: 60, costoEnvio: 3, costoTotal: 63, costoPorGramo: 0.063, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Filamento 3D', especificacionColor: 'Sale', presentacion: 'Sin bobina', cantidad: 5, costoUnitario: 60, costoEnvio: 0, costoTotal: 300, costoPorGramo: 0.06, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Filamento PLA', itemConcepto: 'Bobina con filamento PLA Matte', especificacionColor: 'Con Bobina Reutilizable (BR) 1Kg', presentacion: 'Bobina 1Kg', cantidad: 3, costoUnitario: 79, costoEnvio: 0, costoTotal: 237, costoPorGramo: 0.079, createdAt: fechaEgreso },
      
      // Packaging & Envíos
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, subcategoria: 'Packaging & Envíos', itemConcepto: 'Cajas', especificacionColor: '-', presentacion: 'Unidad', cantidad: 3, costoUnitario: 9.9, costoEnvio: 0, costoTotal: 29.7, createdAt: fechaEgreso },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, subcategoria: 'Packaging & Envíos', itemConcepto: 'Set de sticker', especificacionColor: '-', presentacion: 'Set', cantidad: 2, costoUnitario: 13, costoEnvio: 0, costoTotal: 26, createdAt: fechaEgreso },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, subcategoria: 'Packaging & Envíos', itemConcepto: 'Cubierta de plástico con bolsas de aire', especificacionColor: '-', presentacion: '2 metros', cantidad: 2, costoUnitario: 5, costoEnvio: 0, costoTotal: 10, createdAt: fechaEgreso },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, subcategoria: 'Packaging & Envíos', itemConcepto: 'Cajas', especificacionColor: '-', presentacion: 'Unidad', cantidad: 1, costoUnitario: 12, costoEnvio: 0, costoTotal: 12, createdAt: fechaEgreso },
      { persona: 'Jamile :)', categoria: CategoriaInversion.INSUMO, subcategoria: 'Packaging & Envíos', itemConcepto: 'Cajas', especificacionColor: '-', presentacion: 'Unidad', cantidad: 1, costoUnitario: 18, costoEnvio: 0, costoTotal: 18, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Packaging & Envíos', itemConcepto: 'Papel film', especificacionColor: 'Embalaje protector', presentacion: 'Rollo', cantidad: 1, costoUnitario: 15, costoEnvio: 0, costoTotal: 15, createdAt: fechaEgreso },

      // Servicios & Logística
      { persona: 'Víctor', categoria: CategoriaInversion.SERVICIO, subcategoria: 'Publicidad & Marketing', itemConcepto: 'Publicidad', especificacionColor: '5 días', presentacion: 'Campaña', cantidad: 1, costoUnitario: 123, costoEnvio: 0, costoTotal: 123, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.SERVICIO, subcategoria: 'Logística & Envíos', itemConcepto: 'Taxi envío lince', especificacionColor: 'Envío express', presentacion: 'Servicio', cantidad: 1, costoUnitario: 25.55, costoEnvio: 0, costoTotal: 25.55, createdAt: fechaEgreso },
      { persona: 'Víctor', categoria: CategoriaInversion.INSUMO, subcategoria: 'Otros', itemConcepto: 'otros', especificacionColor: 'Varios taller', presentacion: 'Unidad', cantidad: 1, costoUnitario: 20, costoEnvio: 0, costoTotal: 20, createdAt: fechaEgreso },
    ]
  })

  // 3. Categorías de Producto
  const categoriasBase = [
    { nombre: 'Insertos y Organizadores', descripcion: 'Insertos personalizados para cajas de juegos de mesa' },
    { nombre: 'JUEGOS DE MESA', descripcion: 'Accesorios y tableros para juegos de mesa' },
    { nombre: 'Juegos de Rol & Accesorios', descripcion: 'Torres de dados, contadores y bandejas de rol' },
    { nombre: 'Miniaturas & Decoración', descripcion: 'Figuras, cuadros y elementos decorativos 3D' },
    { nombre: 'Hogar & Oficina', descripcion: 'Soportes, posavasos y utilitarios impresos en 3D' },
  ]

  for (const cat of categoriasBase) {
    await prisma.categoria.create({ data: cat })
  }

  // 4. Catálogo de Productos
  const productosBase = [
    // Insertos y Organizadores
    { lineaCategoria: 'Insertos y Organizadores', nombreModelo: 'Inserto Zombicide 2ª Ed. (10 placas)', costoBase: 78.85, precioAmigos: 105.00, precioMercado: 125.00, precioComunidad: 135.00 },
    { lineaCategoria: 'Insertos y Organizadores', nombreModelo: 'Inserto Gloomhaven: Jaws of the Lion (6 placas)', costoBase: 70.74, precioAmigos: 90.00, precioMercado: 105.00, precioComunidad: 115.00 },

    // Juegos de Mesa (Mansiones de la Locura)
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Kit 1 Jugador (1 Tablero + 2 Marcadores)', costoBase: 9.19, precioAmigos: 20.00, precioMercado: 25.00, precioComunidad: 30.00 },
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Set 2 Jugadores (2 Tableros + 4 Marcadores)', costoBase: 18.38, precioAmigos: 40.00, precioMercado: 50.00, precioComunidad: 55.00 },
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Set 3 Jugadores (3 Tableros + 6 Marcadores)', costoBase: 27.57, precioAmigos: 55.00, precioMercado: 70.00, precioComunidad: 80.00 },
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Set 4 Jugadores (4 Tableros + 8 Marcadores)', costoBase: 36.76, precioAmigos: 70.00, precioMercado: 90.00, precioComunidad: 100.00 },
    { lineaCategoria: 'JUEGOS DE MESA', nombreModelo: 'Mansiones de la Locura - Set 5 Jugadores (5 Tableros + 10 Marcadores)', costoBase: 45.95, precioAmigos: 85.00, precioMercado: 105.00, precioComunidad: 120.00 },

    // Juegos de Rol & Accesorios
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'Torre de Dados de Dragón', costoBase: 49.00, precioAmigos: 65.00, precioMercado: 80.00, precioComunidad: 90.00 },
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'Torre de Dados Árbol Fantasía', costoBase: 47.94, precioAmigos: 65.00, precioMercado: 80.00, precioComunidad: 90.00 },
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'La Cuna del Dragón (Bandeja Multiusos)', costoBase: 18.75, precioAmigos: 25.00, precioMercado: 30.00, precioComunidad: 35.00 },
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'Contador de Munchkin (Individual)', costoBase: 3.65, precioAmigos: 10.00, precioMercado: 10.00, precioComunidad: 15.00 },
    { lineaCategoria: 'Juegos de Rol & Accesorios', nombreModelo: 'Set Contadores Munchkin (Pack x6)', costoBase: 15.98, precioAmigos: 35.00, precioMercado: 50.00, precioComunidad: 60.00 },

    // Miniaturas & Decoración
    { lineaCategoria: 'Miniaturas & Decoración', nombreModelo: 'Pocket Knights - Escuadrón Pesado (Set x4)', costoBase: 9.73, precioAmigos: 15.00, precioMercado: 20.00, precioComunidad: 25.00 },
    { lineaCategoria: 'Miniaturas & Decoración', nombreModelo: 'Cuadro Silueta Evolución Gengar', costoBase: 13.25, precioAmigos: 20.00, precioMercado: 25.00, precioComunidad: 30.00 },

    // Hogar & Oficina
    { lineaCategoria: 'Hogar & Oficina', nombreModelo: 'Soporte Plegable Tablet / iPad', costoBase: 20.11, precioAmigos: 30.00, precioMercado: 35.00, precioComunidad: 40.00 },
    { lineaCategoria: 'Hogar & Oficina', nombreModelo: 'Soporte de Cubiertos de Escritorio', costoBase: 25.98, precioAmigos: 35.00, precioMercado: 45.00, precioComunidad: 50.00 },
    { lineaCategoria: 'Hogar & Oficina', nombreModelo: 'Soporte de Incienso Todo en Uno', costoBase: 15.97, precioAmigos: 25.00, precioMercado: 30.00, precioComunidad: 35.00 },
    { lineaCategoria: 'Hogar & Oficina', nombreModelo: 'Juego de 4 Posavasos Japandi con Soporte', costoBase: 27.65, precioAmigos: 35.00, precioMercado: 45.00, precioComunidad: 50.00 },
  ]

  for (const prod of productosBase) {
    await prisma.producto.create({ data: prod })
  }

  // 5. Ventas Reales
  const productoSet5J = await prisma.producto.findFirst({ where: { nombreModelo: 'Mansiones de la Locura - Set 5 Jugadores (5 Tableros + 10 Marcadores)' } })
  const productoZombicide = await prisma.producto.findFirst({ where: { nombreModelo: 'Inserto Zombicide 2ª Ed. (10 placas)' } })

  if (productoSet5J && productoZombicide) {
    await prisma.venta.createMany({
      data: [
        {
          fecha: new Date('2026-08-14T10:00:00Z'),
          cliente: 'Bryan condemarin',
          productoId: productoSet5J.id,
          nombreProductoSnapshot: productoSet5J.nombreModelo,
          costoBaseSnapshot: productoSet5J.costoBase,
          cantidad: 1,
          tipoPrecio: TipoPrecio.PERSONALIZADO,
          precioUnitario: 82.00,
          total: 82.00,
          montoPagado: 82.00,
          saldoPendiente: 0.00,
          estado: EstadoVenta.ENTREGADO,
        },
        {
          fecha: new Date('2026-08-20T10:00:00Z'),
          cliente: 'Jalmar Pinedo',
          productoId: productoZombicide.id,
          nombreProductoSnapshot: productoZombicide.nombreModelo,
          costoBaseSnapshot: productoZombicide.costoBase,
          cantidad: 1,
          tipoPrecio: TipoPrecio.PERSONALIZADO,
          precioUnitario: 132.00,
          total: 132.00,
          montoPagado: 132.00,
          saldoPendiente: 0.00,
          estado: EstadoVenta.ENTREGADO,
          canalVenta: 'Instagram',
        },
        {
          fecha: new Date('2026-08-23T10:00:00Z'),
          cliente: 'Con Rad',
          productoId: productoZombicide.id,
          nombreProductoSnapshot: productoZombicide.nombreModelo,
          costoBaseSnapshot: productoZombicide.costoBase,
          cantidad: 1,
          tipoPrecio: TipoPrecio.COMUNIDAD,
          precioUnitario: 135.00,
          total: 135.00,
          montoPagado: 135.00,
          saldoPendiente: 0.00,
          estado: EstadoVenta.ENTREGADO,
          diaEntregaPrometida: '26 Miercoles en la noche o 27 Jueves en la mañana',
          destinoEnvio: 'Lince',
          canalVenta: 'Instagram',
        },
        {
          fecha: new Date('2026-08-24T10:00:00Z'),
          cliente: 'Gianmarco Gamarra',
          productoId: productoZombicide.id,
          nombreProductoSnapshot: productoZombicide.nombreModelo,
          costoBaseSnapshot: productoZombicide.costoBase,
          cantidad: 1,
          tipoPrecio: TipoPrecio.COMUNIDAD,
          precioUnitario: 135.00,
          total: 135.00,
          montoPagado: 70.00,
          saldoPendiente: 65.00,
          estado: EstadoVenta.PENDIENTE,
          diaEntregaPrometida: '28 Viernes o 29 Sabado en la mañana',
          destinoEnvio: 'Shalom',
          canalVenta: 'Instagram',
        }
      ]
    })
  }

  // 6. Ingresos Directos
  await prisma.ingreso.createMany({
    data: [
      {
        cliente: 'Banco (Préstamo Bancario)',
        concepto: 'Desembolso Préstamo Capital de Trabajo (24 cuotas)',
        categoria: 'Préstamo Bancario / Financiamiento',
        monto: 8000.00,
        metodoPago: 'TRANSFERENCIA_BCP',
        notas: 'Préstamo de S/ 8,000 a 24 cuotas con TEA 8.70% (Cuota mensual estimada S/ 363.10)',
        fecha: new Date('2026-08-10T10:00:00Z')
      }
    ]
  })

  console.log('✔ Todos los registros al estado exacto de las 10:29 PM restaurados exitosamente!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
