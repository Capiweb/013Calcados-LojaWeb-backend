import { z } from 'zod'

export const VariacaoSchema = z.object({
  tipoTamanho: z.enum(['NUMERICO', 'LETRA']),
  tamanho: z.string(),
  estoque: z.number().int().nonnegative(),
  sku: z.string(),
})

export const ProductCreateSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().min(1),
  preco: z.number().nonnegative(),
  emPromocao: z.boolean().optional().default(false),
  precoPromocional: z.number().nullable().optional(),
  slug: z.string().min(1),
  imagemUrl: z.string().url(),
  categoriaId: z.string().uuid(),
  variacoes: z.array(VariacaoSchema).min(1)
})

export const ProductBulkSchema = z.array(ProductCreateSchema).min(1)
