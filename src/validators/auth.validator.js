import { z } from 'zod'

export const RegisterSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string().min(6, 'A confirmação de senha é obrigatória'),
  documento: z.string().min(1, 'Documento é obrigatório'),
  telefone: z.string().optional(),
})

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})
