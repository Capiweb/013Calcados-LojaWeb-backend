// O Controller lida com a lógica de entrada e saída fazendo validações e chamando o serviço apropriado

import * as userService from '../service/user.js';
import { logError } from '../utils/logger.js';

export const createUser = async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        const newUser = await userService.createUser(nome, email, senha);

        process.env.NODE_ENV === 'development' && console.log('Usuário criado:', newUser);

        return res.status(201).json({
            id: newUser.id,
            nome: newUser.nome,
            email: newUser.email
        });

    } catch (error) {
        logError('user.create', error, { body: req.body });
        
        if (error.message === 'Email já está em uso') {
            return res.status(400).json({ error: error.message });
        }

        return res.status(500).json({ error: 'Erro ao criar usuário, tente novamente.' });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await userService.getUsers();
        return res.status(200).json(users);
    } catch (error) {
        logError('user.getAll', error);
        return res.status(500).json({ error: 'Erro ao buscar usuários, tente novamente.' });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(200).json(user);
    } catch (error) {
        logError('user.getById', error, { params: req.params });
        return res.status(500).json({ error: 'Erro ao buscar usuário, tente novamente.' });
    }   
};

export const getUserFullProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserFullProfile(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(200).json(user);
    } catch (error) {
        logError('user.getFullProfile', error, { params: req.params });
        return res.status(500).json({ error: 'Erro ao buscar dados do usuário, tente novamente.' });
    }   
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, senha } = req.body;
        const updatedUser = await userService.updateUser(id, nome, email, senha);
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(200).json({
            id: updatedUser.id,
            nome: updatedUser.nome,
            email: updatedUser.email
        });
    } catch (error) {
        logError('user.update', error, { params: req.params, body: req.body });     
        if (error.message === 'Email já está em uso') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Erro ao atualizar usuário, tente novamente.' });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await userService.deleteUser(id);
        if (!deletedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(200).json({ message: 'Usuário deletado com sucesso.' });
    } catch (error) {
        logError('user.delete', error, { params: req.params });
        return res.status(500).json({ error: 'Erro ao deletar usuário, tente novamente.' });
    }
};