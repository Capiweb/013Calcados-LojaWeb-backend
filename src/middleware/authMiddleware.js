import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'yourJWTSecret';

export function ensureAuth(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token not provided' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.user = decoded;
    req.isAdmin = (decoded.papel === 'ADMIN' || decoded.role === 'ADMIN')
    next();
  } catch (error) {
    const errorResponse = {
      'TokenExpiredError': { status: 401, message: 'Token expirado' },
      'JsonWebTokenError': { status: 401, message: 'Token inválido' },
      'NotBeforeError': { status: 401, message: 'Token não ativado' }
    }[error.name] || { status: 500, message: 'Erro de autenticação' };
    return res.status(errorResponse.status).json({
      error: errorResponse.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
}

export function ensureAdmin(req, res, next) {
  if (req.isAdmin) return next()
  return res.status(403).json({ error: 'Admin access required' })
}

export default { ensureAuth, ensureAdmin }

// Backwards compatibility: some modules import { authMiddleware }
export const authMiddleware = ensureAuth