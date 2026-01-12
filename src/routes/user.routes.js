// Routes basicamente é as rotas da sua api que chamam os controllers que logo após chamam os services

import { Router } from 'express'
import { createUser, getUsers, getUserById, getUserFullProfile, updateUser, deleteUser} from '../controllers/user.js'
const router = Router()

router.post("/register", createUser) // Rota para criar usuário
router.get("/users", getUsers) // Rota para listar todos os usuários
router.get("/:id/profile", getUserFullProfile) // Rota para obter todos os dados do usuário
router.get("/users/:id", getUserById) // Rota para obter um usuário por ID
router.put("/users/:id", updateUser) // Rota para atualizar um usuário por ID
router.delete("/users/:id", deleteUser) // Rota para deletar um usuário por ID

export default router;