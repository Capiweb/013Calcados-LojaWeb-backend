// Routes basicamente é as rotas da sua api que chamam os controllers que logo após chamam os services

import { Router } from 'express'
import { createUser, getUsers, getUserById, updateUser, deleteUser} from '../controllers/user.js'
const router = Router()

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Criar um novo usuário
 *     tags:
 *       - Usuários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuário criado
 */
router.post("/register", createUser) // Rota para criar usuário

/**
 * @swagger
 * /api/users/users:
 *   get:
 *     summary: Listar todos os usuários
 *     tags:
 *       - Usuários
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get("/users", getUsers) // Rota para listar todos os usuários

/**
 * @swagger
 * /api/users/users/{id}:
 *   get:
 *     summary: Obter usuário por ID
 *     tags:
 *       - Usuários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuário encontrado
 */
router.get("/users/:id", getUserById) // Rota para obter um usuário por ID

router.put("/users/:id", updateUser) // Rota para atualizar um usuário por ID
router.delete("/users/:id", deleteUser) // Rota para deletar um usuário por ID

export default router;