import { z } from 'zod'

export const CreateFeedbackSchema = z.object({
  produtoId: z.string().uuid('ID do produto deve ser um UUID válido'),
  estrelas: z
    .number()
    .min(0.5, 'Avaliação mínima é 0.5 estrelas')
    .max(5.5, 'Avaliação máxima é 5.5 estrelas')
    .refine(
      (value) => {
        // Validar se o valor é múltiplo de 0.5
        return (value * 2) % 1 === 0
      },
      {
        message: 'Avaliação deve ser em incrementos de 0.5 (ex: 1.0, 1.5, 2.0, ...)',
      }
    ),
  comentario: z
    .string()
    .max(1000, 'Comentário não pode exceder 1000 caracteres')
    .optional()
    .nullable(),
})
