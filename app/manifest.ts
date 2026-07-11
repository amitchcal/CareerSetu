import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CareerSetu — AI Mock Interviews',
    short_name: 'CareerSetu',
    description: 'Practice mock interviews in English or Hindi with AI. Get honest feedback for any role.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4F46E5',
    orientation: 'portrait',
       icons: [
      // 192x192 and 512x512 PNGs are the PWA-recommended sizes, but only
      // icon.svg currently exists in /public — referencing files that don't
      // exist 404s on every load (some browsers eagerly fetch manifest
      // icons). Add real 192/512 PNGs here once a final logo is ready.
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    categories: ['education', 'productivity'],
    lang: 'en-IN',
  }
}
