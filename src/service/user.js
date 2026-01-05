// O Service lida com a lógica de negócios e interage com o banco de dados nesse caso usando Prisma

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// C - Criar usuário
// R - Ler usuários
// U - Atualizar usuário
// D - Deletar usuário

// C - Função para criar um usuário

export const createUser = async (name, email, password) => {
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    });
};

// R - Função para obter todos os usuários

export const getUsers = async () => {
    return await prisma.user.findMany({
        select: {   
            id: true,
            name: true,
            email: true
        }
    });
}

// R - Função para obter um usuário por ID

export const getUserById = async (id) =>{
    return await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true
        }
    });
}

// U - Função para atualizar um usuário

export const updateUser = async (id, name, email, password) => {
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser && existingUser.id !== id) {
        throw new Error('Email já está em uso');
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    return await prisma.user.update({
        where: { id },
        data: {
            name,
            email,
            ...(hashedPassword && { password: hashedPassword })
        },
        select: {
            id: true,
            name: true,
            email: true
        }
    });
}

// D - Função para deletar um usuário

export const deleteUser = async (id) => {
    return await prisma.user.delete({
        where: { id }
    });
}