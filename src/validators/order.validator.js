import { z } from 'zod'

export const EnderecoSchema = z.object({
  rua: z.string(),
  numero: z.string(),
  complemento: z.string().optional().nullable(),
  bairro: z.string(),
  cidade: z.string(),
  estado: z.string(),
  cep: z.string()
})

export const CheckoutSchema = z.object({
  endereco: EnderecoSchema.optional()
})
