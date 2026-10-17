/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'node',
    // @pochive/plans ships TypeScript sources, so it must go through Vite's transform.
    server: { deps: { inline: ['@pochive/plans'] } },
  },
})
