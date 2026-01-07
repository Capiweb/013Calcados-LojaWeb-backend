// Utilitário simples de logging de erros com redaction de campos sensíveis
const SENSITIVE_KEYS = ['senha', 'password', 'confirmarSenha', 'confirmPassword'];

const redact = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    const clone = JSON.parse(JSON.stringify(obj));
    const walk = (o) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        Object.keys(o).forEach((k) => {
          if (SENSITIVE_KEYS.includes(k)) {
            o[k] = '<<REDACTED>>';
          } else if (o[k] && typeof o[k] === 'object') {
            walk(o[k]);
          }
        });
      }
    };
    walk(clone);
    return clone;
  } catch (e) {
    return '[unserializable metadata]';
  }
};

export const logError = (context, error, meta = {}) => {
  const err = error || {};
  const payload = {
    context,
    error: {
      name: err.name || null,
      message: err.message || null,
      stack: err.stack || null,
    },
    meta: redact(meta),
  };
  // Print structured JSON so logs are easier to read/search
  console.error('[APP_ERROR]', JSON.stringify(payload, null, 2));
};

export default { logError };
