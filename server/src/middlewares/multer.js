import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOADS_ROOT = path.join(__dirname, '../../uploads')

const FILE_CONFIGS = {
  image: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    extensions: /jpeg|jpg|png|webp/,
    maxSize: 5 * 1024 * 1024, // 5 MB
  },
  document: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: /pdf|doc|docx/,
    maxSize: 10 * 1024 * 1024, // 10 MB
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
    extensions: /mp3|wav|ogg/,
    maxSize: 20 * 1024 * 1024, // 20 MB
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm'],
    extensions: /mp4|webm/,
    maxSize: 200 * 1024 * 1024, // 200 MB
  },
}

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Disk storage — saves file to uploads/<folder>/
const createDiskStorage = (folder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dest = path.join(UPLOADS_ROOT, folder)
      ensureDir(dest)
      cb(null, dest)
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`)
    },
  })

// Memory storage — keeps file in buffer (use with Cloudinary / S3)
const memoryStorage = multer.memoryStorage()

const createFileFilter = (type) => (_req, file, cb) => {
  const config = FILE_CONFIGS[type]
  const ext = path.extname(file.originalname).toLowerCase().slice(1)
  const validMime = config.mimeTypes.includes(file.mimetype)
  const validExt = config.extensions.test(ext)

  if (validMime && validExt) return cb(null, true)
  cb(new Error(`Invalid file type. Only ${type} files are allowed.`), false)
}

// ─── Exported upload middlewares ───────────────────────────────────────────────

// Profile image → memory (ready for cloud upload in controller)
export const uploadProfileImage = multer({
  storage: memoryStorage,
  limits: { fileSize: FILE_CONFIGS.image.maxSize },
  fileFilter: createFileFilter('image'),
}).single('profileImage')

// Payment screenshot → memory (buffer used for Cloudinary upload in controller)
export const uploadPaymentScreenshot = multer({
  storage: memoryStorage,
  limits: { fileSize: FILE_CONFIGS.image.maxSize },
  fileFilter: createFileFilter('image'),
}).single('screenshot')

// Course document → memory (buffer used for Cloudinary upload in controller)
export const uploadDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: FILE_CONFIGS.document.maxSize },
  fileFilter: createFileFilter('document'),
}).single('document')

// Lesson audio → disk
export const uploadAudio = multer({
  storage: createDiskStorage('audio'),
  limits: { fileSize: FILE_CONFIGS.audio.maxSize },
  fileFilter: createFileFilter('audio'),
}).single('audio')

// Lesson video → disk
export const uploadVideo = multer({
  storage: createDiskStorage('videos'),
  limits: { fileSize: FILE_CONFIGS.video.maxSize },
  fileFilter: createFileFilter('video'),
}).single('video')

// ─── Error handler — use after any upload middleware ──────────────────────────

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'File size exceeds the allowed limit.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field name in the upload request.',
      LIMIT_FILE_COUNT: 'Too many files uploaded.',
    }
    return res
      .status(400)
      .json({ success: false, error: { message: messages[err.code] ?? err.message } })
  }

  if (err) {
    return res.status(400).json({ success: false, error: { message: err.message } })
  }

  next()
}
