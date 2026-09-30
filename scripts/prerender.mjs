// Renders the app to static HTML and injects it into dist/index.html so that
// crawlers that don't execute JS still see the page content.
import { readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const ROOT_MARKER = '<div id="root"></div>'
const file = new URL('../dist/index.html', import.meta.url)

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  // @pochive/plans ships TypeScript sources, so it must go through Vite's transform.
  ssr: { noExternal: ['@pochive/plans'] },
})

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')
  const html = await readFile(file, 'utf8')
  if (!html.includes(ROOT_MARKER)) {
    throw new Error(`prerender: ${ROOT_MARKER} not found in dist/index.html`)
  }
  await writeFile(file, html.replace(ROOT_MARKER, () => `<div id="root">${render()}</div>`))
  console.log('prerendered dist/index.html')
} finally {
  await vite.close()
}
