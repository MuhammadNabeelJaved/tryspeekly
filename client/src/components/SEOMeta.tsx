import { useSEO } from '../hooks/useSEO'

interface Props {
  slug: string
  fallbackTitle?: string
  fallbackDescription?: string
}

/**
 * Injects SEO meta tags into <head>.
 * React 19 natively hoists <title>, <meta>, and <link> rendered anywhere in the
 * tree up to <head> — no helmet library required.
 */
export default function SEOMeta({ slug, fallbackTitle = 'TrySpeekly', fallbackDescription = '' }: Props) {
  const seo = useSEO(slug)
  if (!seo) return null

  const title       = (seo.metaTitle || fallbackTitle) + (seo.global?.titleSuffix ?? '')
  const description = seo.metaDescription || fallbackDescription
  const keywords    = seo.metaKeywords?.join(', ') ?? ''
  const canonical   = seo.canonicalUrl ?? ''
  const ogImage     = seo.og?.image || seo.global?.defaultOgImage || ''

  const robotsContent = [
    seo.robots?.index  === false ? 'noindex'   : 'index',
    seo.robots?.follow === false ? 'nofollow'  : 'follow',
    seo.robots?.noArchive        ? 'noarchive' : '',
    seo.robots?.noSnippet        ? 'nosnippet' : '',
  ].filter(Boolean).join(', ')

  return (
    <>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords    && <meta name="keywords"    content={keywords} />}
      {canonical   && <link rel="canonical"    href={canonical} />}
      <meta name="robots" content={robotsContent} />

      {/* Open Graph */}
      <meta property="og:title"       content={seo.og?.title       || title} />
      <meta property="og:description" content={seo.og?.description || description} />
      <meta property="og:type"        content={seo.og?.type        || 'website'} />
      {seo.og?.url      && <meta property="og:url"        content={seo.og.url} />}
      {seo.og?.siteName && <meta property="og:site_name"  content={seo.og.siteName} />}
      {ogImage          && <meta property="og:image"      content={ogImage} />}
      {seo.og?.imageAlt && <meta property="og:image:alt"  content={seo.og.imageAlt} />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content={seo.twitter?.card        || 'summary_large_image'} />
      <meta name="twitter:title"       content={seo.twitter?.title       || title} />
      <meta name="twitter:description" content={seo.twitter?.description || description} />
      {seo.twitter?.image   && <meta name="twitter:image"   content={seo.twitter.image} />}
      {seo.twitter?.site    && <meta name="twitter:site"    content={seo.twitter.site} />}
      {seo.twitter?.creator && <meta name="twitter:creator" content={seo.twitter.creator} />}

      {/* Google Site Verification */}
      {seo.global?.googleSiteVerification && (
        <meta name="google-site-verification" content={seo.global.googleSiteVerification} />
      )}

      {/* JSON-LD Structured Data — valid anywhere in the document for crawlers */}
      {seo.schemaMarkup && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seo.schemaMarkup }} />
      )}
    </>
  )
}
