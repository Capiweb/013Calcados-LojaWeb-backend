import { z } from 'zod'

export const EnderecoCreateSchema = z.object({
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório').max(2),
  cep: z.string().min(8, 'CEP é obrigatório').max(9)
})

export const EnderecoUpdateSchema = z.object({
  rua: z.string().min(1).optional(),
  numero: z.string().min(1).optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(1).optional(),
  cidade: z.string().min(1).optional(),
  estado: z.string().min(2).max(2).optional(),
  cep: z.string().min(8).max(9).optional()
})
