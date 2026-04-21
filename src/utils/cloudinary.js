// Switched from Cloudinary to ImageKit. This file keeps the original export
// names (uploadToCloudinary, deleteFromCloudinary, default export) so
// existing controllers don't need to be changed.

let imagekitInstance = null
const getCloudinary = async () => {
  if (imagekitInstance) return imagekitInstance
  // dynamic import to avoid start-up errors when package isn't installed
  const spec = 'imagekit'
  const module = await import(spec)
  const ImageKit = module.default || module.ImageKit || module

  // build urlEndpoint if not explicitly provided
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || (process.env.IMAGEKIT_CLOUD_NAME ? `https://ik.imagekit.io/${process.env.IMAGEKIT_CLOUD_NAME}` : undefined)

  const ik = new ImageKit({
    publicKey: process.env.IMAGEKIT_API_KEY,
    privateKey: process.env.IMAGEKIT_API_SECRET,
    urlEndpoint,
  })

  imagekitInstance = ik
  return imagekitInstance
}

// Keep the same function name used across the codebase so controllers
// continue to work without edits.
export const uploadToCloudinary = async (buffer, folder = 'produtos') => {
  const ik = await getCloudinary()
  // ImageKit accepts base64 strings for upload. Strip any data URI if present
  const base64 = Buffer.isBuffer(buffer) ? buffer.toString('base64') : String(buffer || '')
  const fileName = `upload-${Date.now()}.jpg`
  const options = {
    file: base64,
    fileName,
    folder: folder ? `/${folder}` : undefined,
    isBase64: true,
  }

  return new Promise((resolve, reject) => {
    ik.upload(options, (error, result) => {
      if (error) return reject(error)
      // Map ImageKit response to a Cloudinary-like shape used in the app
      resolve({ secure_url: result.url, public_id: result.fileId, raw: result })
    })
  })
}

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null
  try {
    const ik = await getCloudinary()
    return new Promise((resolve) => {
      // deleteFile expects the fileId (result.fileId). If a non-ImageKit
      // id is provided (e.g. old Cloudinary ids) the SDK will error —
      // swallow that and return null to avoid breaking callers.
      ik.deleteFile(publicId, (err, result) => {
        if (err) return resolve(null)
        resolve(result)
      })
    })
  } catch (err) {
    return null
  }
}

/**
 * Delete multiple files from ImageKit in parallel.
 * Silently ignores errors for individual files (e.g. already deleted or
 * legacy Cloudinary public_ids that ImageKit doesn't recognise).
 * @param {string[]} publicIds - array of ImageKit fileIds to delete
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return
  await Promise.allSettled(publicIds.map((id) => deleteFromCloudinary(id)))
}

export default getCloudinary
