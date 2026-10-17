/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Read the stylesheet from disk: Vitest blanks CSS imports, even with ?raw.
const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

describe('index.css', () => {
  it('lets a failed or lost effect layer be hidden with the hidden attribute despite .shader-layer setting display', () => {
    expect(css).toMatch(/\.shader-layer\[hidden\]\s*\{[^}]*display:\s*none/)
  })
})
