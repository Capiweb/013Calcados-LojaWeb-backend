// Repository - Camada de acesso ao banco de dados

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findUserByEmail = async (email) => {
  return await prisma.usuario.findUnique({
    where: { email },
    include: {
      enderecos: {
        select: {
          id: true,
          rua: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
          cep: true,
        },
      },
    },
  });
};

export const findUserById = async (id) => {
  return await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
    },
  });
};

export const createUser = async (userData) => {
  return await prisma.usuario.create({
    data: userData,
  });
};

export const getAllUsers = async () => {
  return await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
    },
  });
};

export const updateUser = async (id, userData) => {
  return await prisma.usuario.update({
    where: { id },
    data: userData,
    select: {
      id: true,
      nome: true,
      email: true,
    },
  });
};

export const deleteUser = async (id) => {
  return await prisma.usuario.delete({
    where: { id },
  });
};

