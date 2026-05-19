import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// ─── Folder structure ──────────────────────────────────────────────────────────
export const FOLDERS = {
  userAvatar:           'english-platform/users/avatars',
  courseThumbnail:      'english-platform/courses/thumbnails',
  courseVideoPreview:   'english-platform/courses/previews',
  courseMaterial:       'english-platform/courses/materials',
  paymentScreenshot:    'english-platform/payments/screenshots',
  lessonAudio:          'english-platform/lessons/audio',
  lessonVideo:          'english-platform/lessons/video',
  siteBanner:           'english-platform/site/banners',
  siteLogo:             'english-platform/site/logo',
}

// ─── Core upload helper (multer memoryStorage buffer → Cloudinary) ────────────
const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
    stream.end(buffer)
  })

// ─── User uploads ──────────────────────────────────────────────────────────────

/**
 * Upload or replace a user's profile avatar.
 * Uses the userId as public_id so re-upload overwrites the old file automatically.
 */
export const uploadUserAvatar = (buffer, userId) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.userAvatar,
    public_id: `user_${userId}`,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  })

// ─── Course uploads ────────────────────────────────────────────────────────────

export const uploadCourseThumbnail = (buffer, courseId) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.courseThumbnail,
    public_id: `course_${courseId}`,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 1280, height: 720, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  })

export const uploadCourseVideoPreview = (buffer, courseId) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.courseVideoPreview,
    public_id: `course_preview_${courseId}`,
    overwrite: true,
    resource_type: 'video',
  })

export const uploadCourseMaterial = (buffer, filename) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.courseMaterial,
    public_id: filename,
    resource_type: 'raw', // PDFs / DOCX
  })

export const uploadPaymentScreenshot = (buffer, paymentRef) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.paymentScreenshot,
    public_id: `payment_${paymentRef}`,
    overwrite: false,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })

// ─── Lesson uploads ────────────────────────────────────────────────────────────

export const uploadLessonAudio = (buffer, lessonId) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.lessonAudio,
    public_id: `lesson_${lessonId}`,
    overwrite: true,
    resource_type: 'video', // Cloudinary handles audio under 'video' resource type
  })

export const uploadLessonVideo = (buffer, lessonId) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.lessonVideo,
    public_id: `lesson_${lessonId}`,
    overwrite: true,
    resource_type: 'video',
  })

// ─── Site-wide uploads ─────────────────────────────────────────────────────────

export const uploadSiteBanner = (buffer, bannerId) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.siteBanner,
    public_id: `banner_${bannerId}`,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 1920, height: 600, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  })

export const uploadSiteLogo = (buffer) =>
  uploadBuffer(buffer, {
    folder: FOLDERS.siteLogo,
    public_id: 'logo',
    overwrite: true,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })

// ─── Delete helpers ────────────────────────────────────────────────────────────

/**
 * Delete a single asset by its Cloudinary public_id.
 * @param {string} publicId  - e.g. "english-platform/users/avatars/user_abc123"
 * @param {'image'|'video'|'raw'} resourceType
 */
export const deleteFile = (publicId, resourceType = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType })

/**
 * Delete multiple assets in one API call.
 * @param {string[]} publicIds
 * @param {'image'|'video'|'raw'} resourceType
 */
export const deleteFiles = (publicIds, resourceType = 'image') =>
  cloudinary.api.delete_resources(publicIds, { resource_type: resourceType })

/**
 * Delete an entire folder and all assets inside it.
 * Use with caution — this is irreversible.
 * @param {string} folderPath  - e.g. FOLDERS.userAvatar
 */
export const deleteFolder = (folderPath) =>
  cloudinary.api.delete_resources_by_prefix(folderPath)

// ─── Utility ───────────────────────────────────────────────────────────────────

/**
 * Extract the public_id from a full Cloudinary URL.
 * Useful when you store the URL in the DB and need to delete later.
 */
export const extractPublicId = (url) => {
  const parts = url.split('/')
  const uploadIndex = parts.indexOf('upload')
  if (uploadIndex === -1) return null
  // skip version segment (v1234567890) if present
  const afterUpload = parts.slice(uploadIndex + 1)
  const start = /^v\d+$/.test(afterUpload[0]) ? 1 : 0
  const withExt = afterUpload.slice(start).join('/')
  return withExt.replace(/\.[^/.]+$/, '') // strip extension
}

export default cloudinary
