export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const data = req[source]
    const parsed = schema.parse(data)
    // overwrite with parsed data (casts/defaults)
    req[source] = parsed
    return next()
  } catch (err) {
    return res.status(400).json({ error: err.errors ? err.errors : err.message })
  }
}
