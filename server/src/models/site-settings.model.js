import mongoose from 'mongoose'

const { Schema, model } = mongoose

const siteSettingsSchema = new Schema(
  {
    site: {
      name: { type: String, default: 'English Platform', trim: true },
      tagline: { type: String, trim: true },
      logoText: { type: String, trim: true },
      footerCopyright: { type: String, trim: true },
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      address: { type: String, trim: true },
      workingHours: { type: String, trim: true },
    },
    social: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      youtube: { type: String, trim: true },
    },
    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: { type: String, trim: true },
    },
    paymentsSetup: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false }
)

const SiteSettings = mongoose.models.SiteSettings || model('SiteSettings', siteSettingsSchema)

export default SiteSettings
