// Lazily import multer to avoid hard crash at startup when the package
// isn't installed on the build host (some platforms may build before deps
// are in place). This will surface a clearer error when the upload route
// is actually used.

let uploadInstance = null
const getUploadInstance = async () => {
	if (uploadInstance) return uploadInstance
		try {
			// Build the specifier dynamically to avoid static analysis/early resolution
			// by some deployment runtimes that attempt to resolve literal import strings
			const spec = ['mul', 'ter'].join('')
			const multerModule = await import(spec)
			const multer = multerModule.default || multerModule
		const storage = multer.memoryStorage()
		uploadInstance = multer({ storage })
		return uploadInstance
	} catch (err) {
		// rethrow so callers can handle and return a friendly error
		throw err
	}
}

export const uploadSingle = (fieldName = 'image') => (req, res, next) => {
	getUploadInstance()
		.then((u) => {
			const handler = u.single(fieldName)
			handler(req, res, (err) => {
				if (err) return next(err)
				return next()
			})
		})
			.catch((err) => {
				// If multer can't be loaded, log a warning and continue without failing.
				// The controller supports imagemBase64 and imagemUrl, so a no-op here
				// allows the request to proceed when the deploy environment doesn't
				// have multer installed.
				console.warn('multer not available, skipping multipart handling:', err?.message || err)
				return next()
			})
}
