import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

export function getPrisma(): PrismaClient {
  if (
    !globalThis.prismaGlobal || 
    !('pagoVenta' in globalThis.prismaGlobal) || 
    !('cliente' in globalThis.prismaGlobal) ||
    !('configuracionTienda' in globalThis.prismaGlobal)
  ) {
    if (globalThis.prismaGlobal) {
      try {
        (globalThis.prismaGlobal as any).$disconnect()
      } catch (e) {}
    }
    globalThis.prismaGlobal = prismaClientSingleton()
  }
  return globalThis.prismaGlobal
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    let client = getPrisma()
    if (!(prop in client)) {
      // Re-instantiate if a newly compiled model is being accessed
      globalThis.prismaGlobal = prismaClientSingleton()
      client = globalThis.prismaGlobal
    }
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

export default prisma

