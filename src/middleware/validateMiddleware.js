export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const data = req[source]
    const parsed = schema.parse(data)
    // overwrite with parsed data (casts/defaults)
    req[source] = parsed
    return next()
  } catch (err) {
    // Formatar erros do Zod de forma clara
    if (err.errors && Array.isArray(err.errors)) {
      const formattedErrors = err.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message
      }))
      return res.status(400).json({ errors: formattedErrors })
    }
    return res.status(400).json({ error: err.message })
  }
}
