// Rotas de Autenticação

import { Router } from 'express';
import { register, login, check, isAdmin } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Rota de registro
router.post('/register', register);

// Rota de login
router.post('/login', login);

// Rota para verificar autenticação
router.get('/check', authMiddleware, check);

// Rota para verificar se é admin
router.get('/isAdmin', authMiddleware, isAdmin);

export default router;

