// O Controller lida com a lógica de entrada e saída fazendo validações e chamando o serviço apropriado

import * as userService from '../service/user.js';

export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        const newUser = await userService.createUser(name, email, password);

        process.env.NODE_ENV === 'development' && console.log('Usuário criado:', newUser);

        return res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error.message);
        
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
        console.error('Erro ao buscar usuários:', error.message);
        return res.status(500).json({ error: 'Erro ao buscar usuários, tente novamente.' });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(parseInt(id));
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error.message);
        return res.status(500).json({ error: 'Erro ao buscar usuário, tente novamente.' });
    }   
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        const updatedUser = await userService.updateUser(parseInt(id), name, email, password);
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(200).json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error.message);     
        if (error.message === 'Email já está em uso') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Erro ao atualizar usuário, tente novamente.' });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await userService.deleteUser(parseInt(id));
        if (!deletedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(200).json({ message: 'Usuário deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error.message);
        return res.status(500).json({ error: 'Erro ao deletar usuário, tente novamente.' });
    }
};