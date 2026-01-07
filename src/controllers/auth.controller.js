// Controller de Autenticação - Validações e tratamento de requisições/respostas

import * as authService from '../service/auth.service.js';
import { logError } from '../utils/logger.js';

// Função auxiliar para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função auxiliar para validar senha (mínimo 6 caracteres)
const isValidPassword = (senha) => {
  return senha && senha.length >= 6;
};

// Endpoint de registro
export const register = async (req, res) => {
  try {
    const { nome, email, senha, confirmarSenha } = req.body;

    // Validações de campos obrigatórios
    if (!nome || !email || !senha || !confirmarSenha) {
      return res.status(400).json({
        error: 'Nome, email, senha e confirmação de senha são obrigatórios',
      });
    }

    // Validar formato do email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Email inválido',
      });
    }

    // Validar senha
    if (!isValidPassword(senha)) {
      return res.status(400).json({
        error: 'A senha deve ter no mínimo 6 caracteres',
      });
    }

    // Validar se a senha e confirmação são iguais
    if (senha !== confirmarSenha) {
      return res.status(400).json({
        error: 'A senha e a confirmação de senha não coincidem',
      });
    }

    // Registrar usuário
    const newUser = await authService.registerUser(nome, email, senha);

    // Retornar resposta de sucesso sem dados sensíveis
    return res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        nome: newUser.nome,
        email: newUser.email,
      },
    });
  } catch (error) {
    logError('auth.register', error, { body: req.body });

    // Tratar erro de email já cadastrado
    if (error.message === 'Email já está em uso') {
      return res.status(409).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Erro ao registrar usuário, tente novamente',
    });
  }
};

// Endpoint de login
export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validações de campos obrigatórios
    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
      });
    }

    // Validar formato do email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Email inválido',
      });
    }

    // Fazer login
    const { token, user } = await authService.loginUser(email, senha);

    // Retornar token e dados do usuário
    return res.status(200).json({
      token,
      user: {
        nome: user.nome,
        email: user.email,
        enderecos: user.enderecos,
      },
    });
  } catch (error) {
    logError('auth.login', error, { body: req.body });

    // Tratar erro de credenciais inválidas
    if (error.message === 'Credenciais inválidas') {
      return res.status(401).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Erro ao fazer login, tente novamente',
    });
  }
};

