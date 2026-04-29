// Service de Autenticação - Lógica de negócios para autenticação

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as userRepository from '../repositories/user.repository.js';
import { gerarCupomPrimeiraCompra } from './cupom.service.js';
import { sendPasswordResetCode } from './email.service.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const RESET_TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutos

// Função para registrar um novo usuário
export const registerUser = async (nome, email, senha, documento, telefone) => {
  // Verificar se o email já está cadastrado
  const existingUser = await userRepository.findUserByEmail(email);

  if (existingUser) {
    throw new Error('Email já está em uso');
  }

  // Criptografar a senha
  const hashedPassword = await bcrypt.hash(senha, 10);

  // Criar usuário no banco
  const newUser = await userRepository.createUser({
    nome,
    email,
    senha: hashedPassword,
    documento,
    telefone,
  });

  // Gerar cupom de primeira compra automaticamente
  gerarCupomPrimeiraCompra(newUser.id).catch((err) => {
    console.error('Falha ao gerar cupom de primeira compra:', err)
  })

  // Retornar dados sem informações sensíveis
  return {
    id: newUser.id,
    nome: newUser.nome,
    email: newUser.email,
    telefone: newUser.telefone || null,
  };
};

// Função para fazer login
export const loginUser = async (email, senha) => {
  // Buscar usuário por email
  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    throw new Error('Email inválido');
  }

  // Comparar senha informada com o hash salvo
  const isPasswordValid = await bcrypt.compare(senha, user.senha);

  if (!isPasswordValid) {
    throw new Error('Senha inválida');
  }

  // Validar JWT_SECRET
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não está configurado');
  }

  // Gerar token JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, papel: user.papel },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Retornar token e dados do usuário (sem ID, role ou informações internas)
  return {
    token,
    user: {
      nome: user.nome,
      email: user.email,
      telefone: user.telefone || null,
      enderecos: user.enderecos || [],
    },
  };
};

// Função para buscar usuário por ID
export const getUserById = async (userId) => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    telefone: user.telefone || null,
    papel: user.papel,
  };
};

export const requestPasswordReset = async (email) => {
  const user = await userRepository.findUserByEmail(email);
  if (!user) {
    return { message: 'Se o email estiver cadastrado, um código foi enviado.' };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = await bcrypt.hash(code, 10);
  const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);

  await userRepository.updateUserResetToken(user.id, hashedCode, expiry);

  try {
    await sendPasswordResetCode(email, code);
  } catch (err) {
    console.error('❌ Erro ao enviar email:', err.message);
    console.log(`🔑 [FALLBACK] Código para ${email}: ${code}`);
  }

  return { message: 'Se o email estiver cadastrado, um código foi enviado.' };
};

export const verifyResetCode = async (email, code) => {
  const user = await userRepository.findUserByEmail(email);
  if (!user || !user.resetToken || !user.resetTokenExpiry) {
    throw new Error('Código inválido ou expirado');
  }

  if (new Date() > new Date(user.resetTokenExpiry)) {
    throw new Error('Código expirado');
  }

  const isValid = await bcrypt.compare(code, user.resetToken);
  if (!isValid) {
    throw new Error('Código inválido');
  }

  const resetToken = jwt.sign(
    { id: user.id, email: user.email, type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { resetToken };
};

export const resetPassword = async (resetToken, newPassword) => {
  let decoded;
  try {
    decoded = jwt.verify(resetToken, JWT_SECRET);
  } catch {
    throw new Error('Token inválido ou expirado');
  }

  if (decoded.type !== 'password_reset') {
    throw new Error('Token inválido');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updateUserPassword(decoded.id, hashedPassword);
  await userRepository.clearResetToken(decoded.id);

  return { message: 'Senha atualizada com sucesso' };
};
