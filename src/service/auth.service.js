// Service de Autenticação - Lógica de negócios para autenticação

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/user.repository.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Função para registrar um novo usuário
export const registerUser = async (name, email, password, address = null) => {
  // Verificar se o email já está cadastrado
  const existingUser = await userRepository.findUserByEmail(email);
  
  if (existingUser) {
    throw new Error('Email já está em uso');
  }

  // Criptografar a senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar usuário no banco
  const newUser = await userRepository.createUser({
    name,
    email,
    password: hashedPassword,
    address,
  });

  // Retornar dados sem informações sensíveis
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    address: newUser.address,
  };
};

// Função para fazer login
export const loginUser = async (email, password) => {
  // Buscar usuário por email
  const user = await userRepository.findUserByEmail(email);
  
  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  // Comparar senha informada com o hash salvo
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Credenciais inválidas');
  }

  // Validar JWT_SECRET
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não está configurado');
  }

  // Gerar token JWT
  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Retornar token e dados do usuário (sem ID, role ou informações internas)
  return {
    token,
    user: {
      name: user.name,
      email: user.email,
      address: user.address || null,
    },
  };
};

