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
      papel: true,
      documento: true,
    },
  });
};

export const getUserFullProfile = async (id) => {
  return await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      criadoEm: true,
      atualizadoEm: true,
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
          criadoEm: true,
        },
      },
      pedidos: {
        select: {
          id: true,
          status: true,
          total: true,
          shipping_status: true,
          tracking_number: true,
          rua: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          estado: true,
          cep: true,
          criadoEm: true,
          atualizadoEm: true,
          itens: {
            select: {
              id: true,
              quantidade: true,
              preco: true,
              produtoVariacao: {
                select: {
                  id: true,
                  tamanho: true,
                  sku: true,
                  produto: {
                    select: {
                      id: true,
                      nome: true,
                      imagemUrl: true,
                      imagemPublicId: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          criadoEm: 'desc',
        },
      },
      carrinho: {
        select: {
          id: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      },
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

