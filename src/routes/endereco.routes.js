import express from 'express'
import * as enderecoController from '../controllers/endereco.controller.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import { EnderecoCreateSchema, EnderecoUpdateSchema } from '../validators/endereco.validator.js'

const router = express.Router()

/**
 * @swagger
 * /api/enderecos:
 *   post:
 *     summary: Criar um novo endereço
 *     tags:
 *       - Endereços
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rua
 *               - numero
 *               - bairro
 *               - cidade
 *               - estado
 *               - cep
 *             properties:
 *               rua:
 *                 type: string
 *               numero:
 *                 type: string
 *               complemento:
 *                 type: string
 *               bairro:
 *                 type: string
 *               cidade:
 *                 type: string
 *               estado:
 *                 type: string
 *                 maxLength: 2
 *               cep:
 *                 type: string
 *     responses:
 *       201:
 *         description: Endereço criado com sucesso
 *   get:
 *     summary: Listar endereços do usuário logado
 *     tags:
 *       - Endereços
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de endereços
 */
router.post('/', authMiddleware, validate(EnderecoCreateSchema), enderecoController.create)
router.get('/', authMiddleware, enderecoController.list)

/**
 * @swagger
 * /api/enderecos/{id}:
 *   get:
 *     summary: Buscar um endereço específico
 *     tags:
 *       - Endereços
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Endereço encontrado
 *       404:
 *         description: Endereço não encontrado
 *   put:
 *     summary: Atualizar um endereço
 *     tags:
 *       - Endereços
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rua:
 *                 type: string
 *               numero:
 *                 type: string
 *               complemento:
 *                 type: string
 *               bairro:
 *                 type: string
 *               cidade:
 *                 type: string
 *               estado:
 *                 type: string
 *               cep:
 *                 type: string
 *     responses:
 *       200:
 *         description: Endereço atualizado
 *       404:
 *         description: Endereço não encontrado
 *   delete:
 *     summary: Deletar um endereço
 *     tags:
 *       - Endereços
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Endereço deletado
 *       404:
 *         description: Endereço não encontrado
 */
router.get('/:id', authMiddleware, enderecoController.getById)
router.put('/:id', authMiddleware, validate(EnderecoUpdateSchema), enderecoController.update)
router.delete('/:id', authMiddleware, enderecoController.remove)

export default router
