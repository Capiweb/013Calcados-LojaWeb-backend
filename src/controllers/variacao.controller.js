import * as variacaoService from '../service/variacao.service.js'

export const getAllVariacoes = async (req, res) => {
  try {
    const variacoes = await variacaoService.getAllVariacoes()
    
    if (!variacoes || variacoes.length === 0) {
      return res.status(404).json({ 
        error: 'Nenhuma variação de produto encontrada',
        message: 'Você precisa criar produtos e suas variações primeiro'
      })
    }
    
    return res.status(200).json({
      total: variacoes.length,
      variacoes: variacoes.map(v => ({
        id: v.id,
        tamanho: v.tamanho,
        tipoTamanho: v.tipoTamanho,
        estoque: v.estoque,
        sku: v.sku,
        produto: {
          nome: v.produto.nome,
          preco: v.produto.preco,
          imagemUrl: v.produto.imagemUrl
        }
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar variações:', error)
    return res.status(500).json({ error: 'Erro ao buscar variações de produtos' })
  }
}

export const getVariacaoById = async (req, res) => {
  try {
    const { id } = req.params
    const variacao = await variacaoService.getVariacaoById(id)
    
    if (!variacao) {
      return res.status(404).json({ 
        error: 'Variação não encontrada'
      })
    }
    
    return res.status(200).json(variacao)
  } catch (error) {
    console.error('Erro ao buscar variação:', error)
    return res.status(500).json({ error: 'Erro ao buscar variação' })
  }
}
