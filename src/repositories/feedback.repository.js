import prisma from '../utils/prisma.js'

export const createFeedback = async (data) => {
  return prisma.feedback.create({
    data,
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
    },
  })
}

export const findFeedbackByUserAndProduct = async (usuarioId, produtoId) => {
  return prisma.feedback.findUnique({
    where: {
      usuarioId_produtoId: {
        usuarioId,
        produtoId,
      },
    },
  })
}

export const findFeedbacksByProductId = async (produtoId, { skip = 0, take = 10 } = {}) => {
  return prisma.feedback.findMany({
    where: { produtoId },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
    skip,
    take,
    orderBy: {
      criadoEm: 'desc',
    },
  })
}

export const countFeedbacksByProductId = async (produtoId) => {
  return prisma.feedback.count({
    where: { produtoId },
  })
}

export const calculateAverageRating = async (produtoId) => {
  const result = await prisma.feedback.aggregate({
    where: { produtoId },
    _avg: {
      estrelas: true,
    },
  })

  return result._avg.estrelas || 0
}

export const updateProductRating = async (produtoId, mediaEstrelas) => {
  return prisma.produto.update({
    where: { id: produtoId },
    data: { estrelas: mediaEstrelas },
  })
}

export const deleteFeedback = async (feedbackId) => {
  return prisma.feedback.delete({
    where: { id: feedbackId },
  })
}

export const findFeedbackById = async (feedbackId) => {
  return prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
      produto: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  })
}
