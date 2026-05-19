import mongoose from 'mongoose'

const { Schema, model } = mongoose

// ─── Per-Page SEO Entry ────────────────────────────────────────────────────────
const seoSchema = new Schema(
  {
    pageSlug: {
      type: String,
      required: [true, 'Page slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    pageName: { type: String, required: [true, 'Page name is required'], trim: true },
    pageUrl:  { type: String, default: '/', trim: true },
    isPublic: { type: Boolean, default: true }, // false = dashboard/private page

    // ─── Basic SEO ───────────────────────────────────────────────────────────
    metaTitle:       { type: String, default: '', trim: true },
    metaDescription: { type: String, default: '', trim: true },
    metaKeywords:    [{ type: String, trim: true }],
    canonicalUrl:    { type: String, default: '', trim: true },

    // ─── Robots ──────────────────────────────────────────────────────────────
    robots: {
      index:     { type: Boolean, default: true },
      follow:    { type: Boolean, default: true },
      noArchive: { type: Boolean, default: false },
      noSnippet: { type: Boolean, default: false },
    },

    // ─── Open Graph ──────────────────────────────────────────────────────────
    og: {
      title:       { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      image:       { type: String, default: '', trim: true },
      imageAlt:    { type: String, default: '', trim: true },
      type:        { type: String, default: 'website', enum: ['website', 'article', 'product', 'profile'] },
      url:         { type: String, default: '', trim: true },
      siteName:    { type: String, default: '', trim: true },
      locale:      { type: String, default: 'en_US', trim: true },
    },

    // ─── Twitter Card ─────────────────────────────────────────────────────────
    twitter: {
      card:        { type: String, default: 'summary_large_image', enum: ['summary', 'summary_large_image'] },
      title:       { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      image:       { type: String, default: '', trim: true },
      site:        { type: String, default: '', trim: true },
      creator:     { type: String, default: '', trim: true },
    },

    // ─── Structured Data (JSON-LD) ────────────────────────────────────────────
    schemaMarkup: { type: String, default: '' },

    // ─── Sitemap ──────────────────────────────────────────────────────────────
    sitemap: {
      priority:   { type: Number, default: 0.5, min: 0.0, max: 1.0 },
      changeFreq: { type: String, default: 'weekly', enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'] },
      include:    { type: Boolean, default: true },
    },

    // ─── Global-only fields (used when pageSlug === '__global__') ────────────
    global: {
      titleSuffix:           { type: String, default: '', trim: true },
      defaultOgImage:        { type: String, default: '', trim: true },
      googleAnalyticsId:     { type: String, default: '', trim: true },
      googleSiteVerification:{ type: String, default: '', trim: true },
      bingVerification:      { type: String, default: '', trim: true },
      facebookPixelId:       { type: String, default: '', trim: true },
      robotsTxt:             { type: String, default: 'User-agent: *\nAllow: /\n\nDisallow: /dashboard/\nDisallow: /admin/\nDisallow: /instructor/\n', trim: false },
    },

    lastModified: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
)

seoSchema.index({ pageSlug: 1 })

const Seo = mongoose.models.Seo || model('Seo', seoSchema)
export default Seo
