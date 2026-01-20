import multer from 'multer'

// Use memory storage so we can send buffer directly to Cloudinary
const storage = multer.memoryStorage()
const upload = multer({ storage })

export const uploadSingle = (fieldName = 'image') => upload.single(fieldName)
