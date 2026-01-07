// Repository - Camada de acesso ao banco de dados

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

export const findUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
    },
  });
};

export const createUser = async (userData) => {
  return await prisma.user.create({
    data: userData,
  });
};

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
    },
  });
};

export const updateUser = async (id, userData) => {
  return await prisma.user.update({
    where: { id },
    data: userData,
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
    },
  });
};

export const deleteUser = async (id) => {
  return await prisma.user.delete({
    where: { id },
  });
};

