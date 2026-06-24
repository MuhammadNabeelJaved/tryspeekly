import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// Pull large, stable vendor libraries out of the main bundle into separate,
// long-cacheable chunks. Heavy libs that are only dynamically imported
// (jodit, html2canvas, jspdf, …) are intentionally NOT named here so they
// stay in their own lazy chunks and never load on first paint.
const vendorChunks = (id: string): string | undefined => {
  if (!id.includes('node_modules')) return
  if (id.includes('framer-motion')) return 'motion'
  if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react-vendor'
  if (/node_modules[\\/](socket\.io-client|engine\.io-client|socket\.io-parser|@socket\.io)[\\/]/.test(id)) return 'socketio'
  if (
    /react-markdown|remark|micromark|mdast|unist|hast|vfile|character-entities|property-information|space-separated|comma-separated|trim-lines|trough|bail|devlop|decode-named|longest-streak|zwitch|html-void|web-namespaces|ccount|markdown-table/.test(
      id,
    )
  ) {
    return 'markdown'
  }
  return undefined
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    // Raise the warning threshold — socket.io chunk is intentionally larger
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: vendorChunks,
      },
    },
  },
})
