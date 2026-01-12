import * as userService from '../service/auth.service.js'

export async function adminMiddleware(req, res, next) {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' })

    const user = await userService.getUserById(userId)
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    if (user.papel !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores' })
    }

    next()
  } catch (error) {
    console.error('adminMiddleware', error)
    return res.status(500).json({ error: 'Erro ao verificar permissões' })
  }
}
