// Lazy-load cloudinary to avoid startup crashes when package isn't installed
let cloudinaryInstance = null
const getCloudinary = async () => {
  if (cloudinaryInstance) return cloudinaryInstance
  // build specifier to avoid static analysis by some deployers
  const spec = ['cloud', 'inary'].join('')
  const module = await import(spec)
  const c = module.v2 || module.default || module
  c.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  cloudinaryInstance = c
  return cloudinaryInstance
}

export const uploadToCloudinary = async (buffer, folder = 'produtos') => {
  const cloudinary = await getCloudinary()
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
    stream.end(buffer)
  })
}

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null
  const cloudinary = await getCloudinary()
  return cloudinary.uploader.destroy(publicId)
}

export default getCloudinary
