import * as cupomService from '../service/cupom.service.js'

/**
 * GET /api/cupons/meus
 * Retorna os cupons do usuário autenticado
 */
export const getMeusCupons = async (req, res) => {
  try {
    const userId = req.userId
    const cupons = await cupomService.getMeusCupons(userId)
    return res.status(200).json(cupons)
  } catch (error) {
    console.error('getMeusCupons error:', error)
    return res.status(500).json({ error: 'Erro ao buscar cupons' })
  }
}

/**
 * POST /api/cupons/validar
 * Body: { codigo: string }
 * Valida se o cupom pertence ao usuário e está disponível
 */
export const validarCupom = async (req, res) => {
  try {
    const userId = req.userId
    const { codigo } = req.body

    if (!codigo) {
      return res.status(400).json({ error: 'Código do cupom é obrigatório' })
    }

    const resultado = await cupomService.validarCupom(codigo, userId)

    if (!resultado.valido) {
      return res.status(400).json({ error: resultado.mensagem, valido: false })
    }

    return res.status(200).json({
      valido: true,
      cupom: resultado.cupom,
      desconto: resultado.cupom.desconto,
    })
  } catch (error) {
    console.error('validarCupom error:', error)
    return res.status(500).json({ error: 'Erro ao validar cupom' })
  }
}
