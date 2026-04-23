import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const DESCONTO_PADRAO = 0.10 // 10%

/**
 * Gera um código de cupom único com prefixo
 * @param {string} prefix - 'PC' para primeira compra, 'AV' para avaliação
 * @returns {string}
 */
const gerarCodigo = (prefix) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const aleatorio = Array.from({ length: 8 }, () =>
    chars[Math.floor(crypto.randomInt(0, chars.length))]
  ).join('')
  return `${prefix}-${aleatorio}`
}

/**
 * Gera um código único garantindo não repetir no banco
 * @param {string} prefix
 * @returns {Promise<string>}
 */
const gerarCodigoUnico = async (prefix) => {
  let codigo
  let tentativas = 0
  do {
    codigo = gerarCodigo(prefix)
    const existente = await prisma.cupom.findUnique({ where: { codigo } })
    if (!existente) break
    tentativas++
  } while (tentativas < 10)
  return codigo
}

/**
 * Gera cupom de primeira compra para o usuário.
 * Só gera se o usuário ainda não tiver um cupom de primeira compra.
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export const gerarCupomPrimeiraCompra = async (userId) => {
  try {
    const jaTemCupom = await prisma.cupom.findFirst({
      where: { usuarioId: userId, tipo: 'PRIMEIRA_COMPRA' },
    })
    if (jaTemCupom) return null

    const codigo = await gerarCodigoUnico('PC')
    const cupom = await prisma.cupom.create({
      data: {
        codigo,
        desconto: DESCONTO_PADRAO,
        tipo: 'PRIMEIRA_COMPRA',
        usuarioId: userId,
      },
    })
    return cupom
  } catch (err) {
    console.error('gerarCupomPrimeiraCompra error:', err)
    return null
  }
}

/**
 * Gera cupom de avaliação de produto para o usuário.
 * Só gera se o usuário ainda não tiver um cupom de avaliação não usado.
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export const gerarCupomAvaliacao = async (userId) => {
  try {
    const codigo = await gerarCodigoUnico('AV')
    const cupom = await prisma.cupom.create({
      data: {
        codigo,
        desconto: DESCONTO_PADRAO,
        tipo: 'AVALIACAO_PRODUTO',
        usuarioId: userId,
      },
    })
    return cupom
  } catch (err) {
    console.error('gerarCupomAvaliacao error:', err)
    return null
  }
}

/**
 * Retorna todos os cupons do usuário (válidos e usados)
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
export const getMeusCupons = async (userId) => {
  return prisma.cupom.findMany({
    where: { usuarioId: userId },
    orderBy: [{ usado: 'asc' }, { criadoEm: 'desc' }],
  })
}

/**
 * Valida um cupom pelo código.
 * Verifica: existe, pertence ao usuário, não foi usado, não expirou.
 * @param {string} codigo
 * @param {string} userId
 * @returns {Promise<Object>} - { valido: boolean, cupom?, mensagem? }
 */
export const validarCupom = async (codigo, userId) => {
  if (!codigo || !codigo.trim()) {
    return { valido: false, mensagem: 'Código do cupom é obrigatório' }
  }

  const cupom = await prisma.cupom.findUnique({
    where: { codigo: codigo.trim().toUpperCase() },
  })

  if (!cupom) {
    return { valido: false, mensagem: 'Cupom não encontrado' }
  }

  if (cupom.usuarioId !== userId) {
    return { valido: false, mensagem: 'Este cupom não pertence a você' }
  }

  if (cupom.usado) {
    return { valido: false, mensagem: 'Este cupom já foi utilizado' }
  }

  if (cupom.expiraEm && new Date() > new Date(cupom.expiraEm)) {
    return { valido: false, mensagem: 'Este cupom expirou' }
  }

  return { valido: true, cupom }
}

/**
 * Marca o cupom como usado
 * @param {string} codigo
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export const marcarComoUsado = async (codigo, userId) => {
  try {
    const cupom = await prisma.cupom.findUnique({
      where: { codigo: codigo.trim().toUpperCase() },
    })
    if (!cupom || cupom.usuarioId !== userId) return null

    return prisma.cupom.update({
      where: { id: cupom.id },
      data: { usado: true },
    })
  } catch (err) {
    console.error('marcarComoUsado error:', err)
    return null
  }
}
