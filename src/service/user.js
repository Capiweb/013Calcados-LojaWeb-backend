// O Service lida com a lógica de negócios e interage com o banco de dados nesse caso usando Prisma

import bcrypt from 'bcrypt';
import * as userRepository from '../repositories/user.repository.js';

// C - Criar usuário
// R - Ler usuários
// U - Atualizar usuário
// D - Deletar usuário

// C - Função para criar um usuário

export const createUser = async (nome, email, senha) => {
    const existingUser = await userRepository.findUserByEmail(email);

    if (existingUser) {
        throw new Error('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    return await userRepository.createUser({
        nome,
        email,
        senha: hashedPassword
    });
};

// R - Função para obter todos os usuários

export const getUsers = async () => {
    return await userRepository.getAllUsers();
}

// R - Função para obter um usuário por ID

export const getUserById = async (id) =>{
    return await userRepository.findUserById(id);
}

// U - Função para atualizar um usuário

export const updateUser = async (id, nome, email, senha) => {
    const existingUser = await userRepository.findUserByEmail(email);

    if (existingUser && existingUser.id !== id) {
        throw new Error('Email já está em uso');
    }

    const hashedPassword = senha ? await bcrypt.hash(senha, 10) : undefined;

    return await userRepository.updateUser(id, {
        ...(nome && { nome }),
        ...(email && { email }),
        ...(hashedPassword && { senha: hashedPassword })
    });
}

// D - Função para deletar um usuário

export const deleteUser = async (id) => {
    return await userRepository.deleteUser(id);
}