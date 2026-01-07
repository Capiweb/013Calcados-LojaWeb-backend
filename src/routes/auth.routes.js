// Rotas de Autenticação

import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

// Rota de registro
router.post('/register', register);

// Rota de login
router.post('/login', login);

export default router;

