import { PrismaClient } from '@prisma/client'

// Criar instância global do Prisma
let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  // Em desenvolvimento, usar uma instância global para evitar múltiplas conexões
  if (!global.prismaInstance) {
    global.prismaInstance = new PrismaClient({
      log: ['warn', 'error'],
    })
  }
  prisma = global.prismaInstance
}

export default prisma
