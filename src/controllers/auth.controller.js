// Controller de Autenticação - Validações e tratamento de requisições/respostas

import * as authService from '../service/auth.service.js';

// Função auxiliar para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função auxiliar para validar senha (mínimo 6 caracteres)
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Endpoint de registro
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, address } = req.body;

    // Validações de campos obrigatórios
    if (!name || !email || !password || !confirmPassword) {
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
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'A senha deve ter no mínimo 6 caracteres',
      });
    }

    // Validar se a senha e confirmação são iguais
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'A senha e a confirmação de senha não coincidem',
      });
    }

    // Registrar usuário
    const newUser = await authService.registerUser(name, email, password, address);

    // Retornar resposta de sucesso sem dados sensíveis
    return res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error.message);

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
    const { email, password } = req.body;

    // Validações de campos obrigatórios
    if (!email || !password) {
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
    const { token, user } = await authService.loginUser(email, password);

    // Retornar token e dados do usuário
    return res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);

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

