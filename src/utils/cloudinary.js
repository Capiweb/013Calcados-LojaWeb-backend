import { v2 as cloudinary } from 'cloudinary'

// Configure cloudinary via ENV: CLOUDINARY_URL or separate env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const uploadToCloudinary = async (buffer, folder = 'produtos') => {
  // buffer -> upload via stream
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
  return cloudinary.uploader.destroy(publicId)
}

export default cloudinary
