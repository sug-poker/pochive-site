# Pochive サイト シェーダー刷新 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ページ全体に固定の WebGL シェーダー背景を敷き、Hero の「配る → 記録 → データ化」演出、機能 4 つの演出、すりガラス調のセクションスタイルを実装する。

**Architecture:** `ShaderBackground` コンポーネントが `position: fixed` の canvas を 1 枚描画する。WebGL の初期化はクライアント側の `useEffect` で行う。ページ上の `data-shader-anchor` 要素の位置を毎フレーム測ってユニフォームとしてシェーダーに渡し、演出をスマホ画像や文字ブロックに追従させる。座標計算などの純粋なロジックは `src/background/scene.ts` に分け、Vitest でテストする。シェーダーのコンパイルと見た目は、ヘッドレス Chrome で確認する。

**Tech Stack:** React 19, TypeScript, Vite 8, 素の WebGL1（GLSL ES 1.0）, Vitest（新規の devDependency）

**Spec:** `docs/superpowers/specs/2026-10-17-shader-redesign-design.md`
**見た目の正:** `docs/superpowers/specs/assets/2026-10-17-shader-mockup.html`（承認済みモックアップ。GLSL の移植元）

## Global Constraints

- three.js などの 3D/WebGL ライブラリを追加しない。追加してよい依存は `vitest` だけ（devDependency）
- 文言（コピー）を変えない。追加するのは英字ラベル `FEATURES` / `PRICING` / `CONTACT` と機能番号 `01 / SESSION`・`02 / HAND`・`03 / BANKROLL`・`04 / TRIP` だけ
- `public/privacy-policy`、`public/terms`、`.github/workflows/deploy.yml`、`vite.config.ts` の `base` を変えない
- テーマ色だけを使う: `--bg #0a0f0d` / `--surface #111a14` / `--text #f0e6c8` / `--gold #c9a84c` / `--muted #8a9b8e` / `--border #1c2b22`。シェーダー内のゴールドは `vec3(.79,.66,.30)`。赤・白・黒のトランプ色は使わない
- グリッド上を走るパルス線、チップ、テーブルの楕円ラインは描かない
- WebGL と `window`・`document` へのアクセスは `useEffect` の中だけで行う（`scripts/prerender.mjs` の SSR を壊さない）
- canvas は `aria-hidden="true"` と `pointer-events: none` にする
- devicePixelRatio の上限: デスクトップ 1.5、モバイル（幅 768px 以下、または `pointer: coarse`）1
- ブレークポイントは既存どおり `max-width: 768px`
- スタイルは `src/index.css` に書く（既存の慣習）

## Review Focus

1. **ハッシュ付き URL で途中から開く（`/#pricing`）:** 初回描画から Hero の演出が消えていて、スポットライトも正しい位置にあること。scrollY が 0 だと仮定しない → Task 4 の検証ステップ
2. **ウィンドウのリサイズやスマホの回転:** canvas が引き伸ばされず、演出が新しい位置のスマホ画像に追従すること → Task 4 の検証ステップ
3. **WebGL コンテキストの喪失（iOS Safari でバックグラウンドから復帰したときなど）:** エラーを出さず CSS のフェルト背景に切り替わること → Task 3 の `watchContextLoss` のテスト
4. **canvas の上にあるボタンやリンク:** App Store ボタン、Nav、メールリンクがクリックできること → Task 4 の検証ステップ
5. **タブを非表示にしたとき:** 描画が止まり、戻ったときに演出が正しく再開すること → Task 4 の検証ステップ

---

## ファイルマップ

| ファイル | 変更種別 | 役割 |
|---|---|---|
| `package.json` | 修正 | `vitest` を追加し、`test` スクリプトを追加 |
| `vite.config.ts` | 修正 | Vitest の設定（`environment: 'node'`、`@pochive/plans` のインライン化） |
| `src/background/scene.ts` | 新規 | 座標・フェード・設定の純粋関数 |
| `src/background/scene.test.ts` | 新規 | 上記のテスト |
| `src/shaders/common.glsl` | 新規 | hash / noise / fbm / スートの SDF / `line` / `rot` / `sdRoundBox` |
| `src/shaders/hero.glsl` | 新規 | `heroDeal()`（配る → 走査 → 粒） |
| `src/shaders/features.glsl` | 新規 | `fxSession` / `fxHand` / `fxBankroll` / `fxTrip` / `featureFx` |
| `src/shaders/background.frag.glsl` | 新規 | ユニフォーム宣言と `main()`（フェルト・スポットライト・型押し・スートノード・合成） |
| `src/background/shaderSource.ts` | 新規 | GLSL の結合と `FBM_OCTAVES` の注入、頂点シェーダー |
| `src/background/shaderSource.test.ts` | 新規 | 上記のテスト |
| `src/background/renderer.ts` | 新規 | WebGL のプログラム生成、リサイズ、描画、コンテキスト喪失の監視 |
| `src/background/renderer.test.ts` | 新規 | `createRenderer` の null 経路と `watchContextLoss` のテスト |
| `src/components/ShaderBackground.tsx` | 新規 | canvas、アンカーの計測、描画ループ、フォールバック |
| `src/pages/Home.tsx` | 修正 | `<ShaderBackground />` を先頭に追加 |
| `src/components/HeroSection.tsx` | 修正 | アンカー属性、カードの場の要素 |
| `src/components/FeaturesSection.tsx` | 修正 | アンカー属性、英字ラベル、機能番号 |
| `src/components/PricingSection.tsx` | 修正 | 英字ラベル |
| `src/components/ContactSection.tsx` | 修正 | 英字ラベル |
| `src/entry-server.test.tsx` | 新規 | SSR 出力のテスト |
| `src/index.css` | 修正 | 背景、フォールバック、セクションスタイルの刷新 |

## シェーダーのユニフォーム（Task 2〜6 で共通の契約）

座標はすべてデバイスピクセルで、y は下から上（`gl_FragCoord` と同じ向き）。JS 側で `(innerHeight - y) * pixelRatio` に変換して渡す。

| ユニフォーム | 型 | 内容 |
|---|---|---|
| `uRes` | vec2 | canvas のサイズ |
| `uTime` | float | 秒数（reduced motion のときは `REDUCED_MOTION_TIME` で固定） |
| `uLight` | vec2 | スポットライトの中心 |
| `uHero` | float | Hero 演出の強さ（0〜1）= `heroFade()` |
| `uPhone` | vec2 | Hero のスマホ画像の中心（粒が流れ込む先） |
| `uCards` | vec3 | カードの場: (左端 x, 中心 y, 1 単位の大きさ) = `cardSceneRect()` |
| `uStacked` | float | 縦並びレイアウト（768px 以下）なら 1、それ以外は 0 |
| `uF0`〜`uF3` | vec4 | 機能 i のスマホ画像: (中心 x, 中心 y, 高さ, 強さ `featureAmount()`) |
| `uFSide` | vec4 | 機能 i の `textSide()`（1 / -1 / 0） |

---

### Task 1: テスト基盤と scene.ts の純粋関数

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `src/background/scene.ts`
- Test: `src/background/scene.test.ts`

**Interfaces:**
- Produces（`src/background/scene.ts`）:
  - `heroFade(scrollY: number, viewportHeight: number): number`
  - `featureAmount(centerY: number, viewportHeight: number): number`
  - `textSide(phoneCenterX: number, viewportWidth: number, stacked: boolean): 1 | -1 | 0`
  - `lightTarget(input: { scrollY: number; viewport: { width: number; height: number }; mouse: [number, number] | null; heroPhone: [number, number] | null; featurePhones: Array<[number, number]> }): [number, number]`
  - `CARD_SCENE_WIDTH = 5.5`
  - `cardSceneRect(anchor: { left: number; top: number; width: number; height: number }, centered: boolean): { left: number; centerY: number; unit: number }`
  - `renderSettings(env: { stacked: boolean; coarsePointer: boolean; reducedMotion: boolean; devicePixelRatio: number }): { pixelRatio: number; fbmOctaves: number; animate: boolean; maxFps: number }`
  - `REDUCED_MOTION_TIME = 8.0`

- [ ] **Step 1: Vitest を入れる**

`npm i -D vitest`。`package.json` の scripts に `"test": "vitest run"` を追加する。`vite.config.ts` の先頭に `/// <reference types="vitest/config" />` を足し、`test: { environment: 'node', server: { deps: { inline: ['@pochive/plans'] } } }` を追加する（`@pochive/plans` は TS ソースのまま配布されているため）。

- [ ] **Step 2: 失敗するテストを書く（`src/background/scene.test.ts`）**

```ts
import { describe, expect, it } from 'vitest'
import { CARD_SCENE_WIDTH, cardSceneRect, featureAmount, heroFade, lightTarget, renderSettings, textSide } from './scene'

describe('heroFade', () => {
  it('is 1 at the top and 0 after 80% of a viewport', () => {
    expect(heroFade(0, 1000)).toBe(1)
    expect(heroFade(800, 1000)).toBe(0)
    expect(heroFade(5000, 1000)).toBe(0)
  })
  it('eases with smoothstep', () => {
    expect(heroFade(400, 1000)).toBeCloseTo(0.5)
    expect(heroFade(200, 1000)).toBeCloseTo(0.84375)
  })
})

describe('featureAmount', () => {
  it('peaks when the phone is at the viewport centre and is 0 beyond 55% of a viewport', () => {
    expect(featureAmount(500, 1000)).toBe(1)
    expect(featureAmount(500 + 550, 1000)).toBe(0)
    expect(featureAmount(500 - 275, 1000)).toBeCloseTo(0.5)
  })
})

describe('textSide', () => {
  it('points away from the phone side, or 0 when stacked', () => {
    expect(textSide(300, 1280, false)).toBe(1)
    expect(textSide(1000, 1280, false)).toBe(-1)
    expect(textSide(195, 390, true)).toBe(0)
  })
})

describe('lightTarget', () => {
  const viewport = { width: 1280, height: 900 }
  it('follows the mouse in the hero', () => {
    expect(lightTarget({ scrollY: 0, viewport, mouse: [100, 200], heroPhone: [1000, 450], featurePhones: [] })).toEqual([100, 200])
  })
  it('defaults to the hero phone without a mouse (touch devices)', () => {
    expect(lightTarget({ scrollY: 0, viewport, mouse: null, heroPhone: [1000, 450], featurePhones: [] })).toEqual([1000, 450])
  })
  it('falls back to 70% / 45% of the viewport with neither', () => {
    expect(lightTarget({ scrollY: 0, viewport, mouse: null, heroPhone: null, featurePhones: [] })).toEqual([896, 405])
  })
  it('locks onto the feature phone nearest the centre once past half a viewport', () => {
    const featurePhones: Array<[number, number]> = [[300, 100], [900, 480]]
    expect(lightTarget({ scrollY: 2000, viewport, mouse: [5, 5], heroPhone: null, featurePhones })).toEqual([900, 480])
  })
  it('ignores feature phones further than 40% of a viewport from the centre', () => {
    expect(lightTarget({ scrollY: 2000, viewport, mouse: [5, 5], heroPhone: null, featurePhones: [[300, 900]] })).toEqual([5, 5])
  })
})

describe('cardSceneRect', () => {
  it('uses the anchor height as the unit when the anchor is wide enough, left-aligned', () => {
    expect(cardSceneRect({ left: 100, top: 600, width: 800, height: 120 }, false)).toEqual({ left: 100, centerY: 660, unit: 120 })
  })
  it('shrinks the unit to fit a narrow anchor and centres it', () => {
    const r = cardSceneRect({ left: 16, top: 600, width: 330, height: 120 }, true)
    expect(r.unit).toBeCloseTo(330 / CARD_SCENE_WIDTH)
    expect(r.left).toBeCloseTo(16)
    const c = cardSceneRect({ left: 0, top: 0, width: 1000, height: 100 }, true)
    expect(c.left).toBeCloseTo((1000 - 100 * CARD_SCENE_WIDTH) / 2)
  })
})

describe('renderSettings', () => {
  it('desktop: dpr capped at 1.5, 5 fbm octaves', () => {
    expect(renderSettings({ stacked: false, coarsePointer: false, reducedMotion: false, devicePixelRatio: 2 }))
      .toEqual({ pixelRatio: 1.5, fbmOctaves: 5, animate: true, maxFps: 60 })
  })
  it('mobile (narrow or coarse pointer): dpr 1, 3 fbm octaves', () => {
    expect(renderSettings({ stacked: true, coarsePointer: false, reducedMotion: false, devicePixelRatio: 3 }).pixelRatio).toBe(1)
    expect(renderSettings({ stacked: false, coarsePointer: true, reducedMotion: false, devicePixelRatio: 3 }).fbmOctaves).toBe(3)
  })
  it('reduced motion turns animation off', () => {
    expect(renderSettings({ stacked: false, coarsePointer: false, reducedMotion: true, devicePixelRatio: 1 }).animate).toBe(false)
  })
})
```

- [ ] **Step 3: 失敗を確認する**

Run: `npm test`
Expected: FAIL（`./scene` が存在しない）

- [ ] **Step 4: `src/background/scene.ts` を実装する**

式はモックアップの JS 部分と同じにする。`smoothstep` は `t*t*(3-2t)`。`heroFade` は `1 - clamp(scrollY / (0.8 * vh))` を smoothstep したもの。`featureAmount` は `1 - min(1, |cy - vh/2| / (0.55 * vh))` を smoothstep したもの。`lightTarget` は `scrollY > 0.5 * vh` のとき、中心からの縦距離が `0.4 * vh` 未満で最も近い機能スマホを返す。該当がなければ mouse → heroPhone → `[0.7w, 0.45h]` の順で返す。`maxFps` は今は全環境で 60（軽量化の 3 段目として 30 に下げる余地を残す。Task 6 参照）。

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test`
Expected: PASS（全件）

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/background/scene.ts src/background/scene.test.ts
git commit -m "feat: add scene math for shader background with vitest"
```

---

### Task 2: GLSL の移植とシェーダーの組み立て

**Files:**
- Create: `src/shaders/common.glsl`, `src/shaders/hero.glsl`, `src/shaders/features.glsl`, `src/shaders/background.frag.glsl`, `src/background/shaderSource.ts`
- Test: `src/background/shaderSource.test.ts`

**Interfaces:**
- Consumes: 上のユニフォーム表
- Produces（`src/background/shaderSource.ts`）:
  - `buildFragmentSource(opts: { fbmOctaves: number }): string`
  - `VERTEX_SOURCE: string`（モックアップの `VERT` と同じ）

- [ ] **Step 1: 失敗するテストを書く（`src/background/shaderSource.test.ts`）**

```ts
import { describe, expect, it } from 'vitest'
import { buildFragmentSource, VERTEX_SOURCE } from './shaderSource'

describe('buildFragmentSource', () => {
  const src = buildFragmentSource({ fbmOctaves: 3 })
  it('starts with a single precision line followed by the octave define', () => {
    expect(src.startsWith('precision highp float;\n#define FBM_OCTAVES 3\n')).toBe(true)
    expect(src.match(/precision /g)).toHaveLength(1)
  })
  it('includes every part exactly once', () => {
    for (const fn of ['float fbm(', 'vec3 heroDeal(', 'vec3 featureFx(', 'void main(']) {
      expect(src.split(fn)).toHaveLength(2)
    }
  })
  it('declares the uniform contract', () => {
    for (const u of ['uRes', 'uTime', 'uLight', 'uHero', 'uPhone', 'uCards', 'uStacked', 'uF0', 'uF1', 'uF2', 'uF3', 'uFSide']) {
      expect(src).toMatch(new RegExp(`uniform \\w+ ${u};`))
    }
  })
  it('never draws grid pulses, chips or the table oval', () => {
    expect(src).not.toMatch(/pulseX|chip\(|rail/)
  })
  it('vertex shader passes the full-screen triangle through', () => {
    expect(VERTEX_SOURCE).toContain('gl_Position')
  })
})
```

- [ ] **Step 2: 失敗を確認する**

Run: `npm test -- shaderSource`
Expected: FAIL（モジュールがない）

- [ ] **Step 3: GLSL を 4 ファイルに移植する**

移植元はモックアップの `FRAG` 文字列。ファイルに `precision` は書かない（`buildFragmentSource` が付ける）。すべてのユニフォームは `background.frag.glsl` ではなく `common.glsl` の先頭で宣言する（`hero.glsl` と `features.glsl` が使うため）。モックアップからの変更点:

- `common.glsl`: `fbm` のループ回数を `FBM_OCTAVES` にする（GLSL ES 1.0 はループ上限が定数でなければならず、`#define` ならこれを満たす）。`line` / `rot` / `sdRoundBox` / `suit` / `sdHeart` / `sdBox` / `hash` / `noise` もここに置く
- `features.glsl`: `local()` で `f.z` の符号を使うのをやめ、`local(p, f, side)` として `q.x *= side` にする。`side` が 0 のときは `q.x` をそのまま使う（反転しない）。`featureFx` は `uFSide.x`〜`.w` を各機能に渡す。縦並びの扱いは Task 6 で入れる
- `hero.glsl`: カードの座標を固定の p 空間から `uCards` 基準の局所座標に置き換える。局所座標の 1 単位 = `uCards.z` デバイス px で、原点は `(uCards.x, uCards.y)`。モックアップの p 空間の定数を 0.13（モックアップでのカードの高さ）で割った値を使う:
  - カードの半サイズ `(0.346, 0.5)`、角丸 `0.06`
  - 中心 x: ホール `0.35`、`0.93`／ボード `1.73 + i*0.846`（i = 0..4）、y は 0
  - 回転: ホール 1 枚目 `0.14`、2 枚目 `-0.08`、ボードは 0
  - 配る落下量 `(1-a)*0.92`
  - 走査ラインの x: `-0.3` → `5.9`
  - 走査ラインの帯: y `±1.15`
  - 線幅とスートの拡大率もモックアップの値 ÷ 0.13
  
  タイムライン（11 秒ループ、各カードの配るタイミング、走査 4.0〜6.5 秒、フェード 9.8〜10.8 秒）と色（面 `vec3(.075,.12,.09)`、マーク `vec3(.94,.9,.78)`、縁 `vec3(.54,.61,.56)`、記録後は GOLD のワイヤーフレーム）はモックアップどおり。光の粒の行き先は `uPhone`
- `background.frag.glsl`: モックアップの `main()` のうち、フェルト、スポットライト、型押しスート、Hero 以外でのスートノード、`heroDeal(p, light) * uHero`、`featureFx(p)`、ビネット

- [ ] **Step 4: `src/background/shaderSource.ts` を実装する**

4 ファイルを `?raw` で import し、`precision highp float;\n#define FBM_OCTAVES ${n}\n` + common + hero + features + background の順で連結する。

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/shaders src/background/shaderSource.ts src/background/shaderSource.test.ts
git commit -m "feat: port approved mockup shaders into modular glsl sources"
```

（GLSL のコンパイル確認は、描画できるようになる Task 4 の検証で行う）

---

### Task 3: WebGL レンダラー

**Files:**
- Create: `src/background/renderer.ts`
- Test: `src/background/renderer.test.ts`

**Interfaces:**
- Consumes: `VERTEX_SOURCE`、`buildFragmentSource()` の出力（引数として受け取る）
- Produces（`src/background/renderer.ts`）:
  - `type Vec2 = [number, number]`
  - `type Uniforms = { res: Vec2; time: number; light: Vec2; hero: number; phone: Vec2; cards: [number, number, number]; stacked: number; features: [number, number, number, number][]; featureSides: [number, number, number, number] }`（`features` は長さ 4。足りない分は `[0,0,1,0]`）
  - `interface Renderer { resize(width: number, height: number): void; draw(u: Uniforms): void; dispose(): void }`（width と height はデバイス px）
  - `createRenderer(canvas: HTMLCanvasElement, fragmentSource: string): Renderer | null`
  - `watchContextLoss(canvas: EventTarget, onLost: () => void): () => void`（戻り値は購読解除の関数）

- [ ] **Step 1: 失敗するテストを書く（`src/background/renderer.test.ts`）**

```ts
import { describe, expect, it, vi } from 'vitest'
import { createRenderer, watchContextLoss } from './renderer'

describe('createRenderer', () => {
  it('returns null when WebGL is unavailable', () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement
    expect(createRenderer(canvas, 'void main(){}')).toBeNull()
  })
})

describe('watchContextLoss', () => {
  it('calls onLost once on webglcontextlost and stops after unsubscribe', () => {
    const target = new EventTarget()
    const onLost = vi.fn()
    const off = watchContextLoss(target, onLost)
    target.dispatchEvent(new Event('webglcontextlost'))
    expect(onLost).toHaveBeenCalledTimes(1)
    off()
    target.dispatchEvent(new Event('webglcontextlost'))
    expect(onLost).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: 失敗を確認する**

Run: `npm test -- renderer`
Expected: FAIL

- [ ] **Step 3: `src/background/renderer.ts` を実装する**

`getContext('webgl', { antialias: false })` が null なら null を返す。シェーダーのコンパイルかリンクに失敗したら、`console.error` に info log を出して null を返す。全画面三角形 `[-1,-1, 3,-1, -1,3]` の描き方はモックアップと同じ。ユニフォームの location は生成時に 1 回だけ取得する。`dispose` ではプログラムとバッファを削除する。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/background/renderer.ts src/background/renderer.test.ts
git commit -m "feat: add minimal webgl renderer with context-loss watcher"
```

---

### Task 4: ShaderBackground とアンカー、フォールバック

**Files:**
- Create: `src/components/ShaderBackground.tsx`, `src/entry-server.test.tsx`
- Modify: `src/pages/Home.tsx`, `src/components/HeroSection.tsx`, `src/components/FeaturesSection.tsx`, `src/index.css`

**Interfaces:**
- Consumes: Task 1〜3 のすべて
- Produces:
  - アンカー属性 `data-shader-anchor`。値は `"hero-phone"`（Hero の `.iphone-frame`）、`"hero-cards"`（CTA の直後に置く新しい `<div className="hero-cards" aria-hidden="true" />`）、`"feature"`（各 `.iphone-frame-md`、DOM 順）
  - `<canvas className="shader-bg" aria-hidden="true" />`
  - WebGL が使えないとき、または喪失したとき、`<html>` に付けるクラス `no-webgl`

- [ ] **Step 1: 失敗するテストを書く（`src/entry-server.test.tsx`）**

```tsx
import { describe, expect, it } from 'vitest'
import { render } from './entry-server'

describe('prerender output', () => {
  const html = render()
  it('renders the background canvas hidden from assistive tech', () => {
    expect(html).toMatch(/<canvas class="shader-bg" aria-hidden="true"/)
  })
  it('marks the hero phone, the card scene and all four feature phones', () => {
    expect(html.match(/data-shader-anchor="hero-phone"/g)).toHaveLength(1)
    expect(html.match(/data-shader-anchor="hero-cards"/g)).toHaveLength(1)
    expect(html.match(/data-shader-anchor="feature"/g)).toHaveLength(4)
  })
})
```

- [ ] **Step 2: 失敗を確認する**

Run: `npm test -- entry-server`
Expected: FAIL（canvas とアンカーがまだない）

- [ ] **Step 3: アンカーとカードの場の要素を足す**

`HeroSection.tsx` と `FeaturesSection.tsx` に、上の Interfaces どおり属性と要素を追加する。

- [ ] **Step 4: `ShaderBackground.tsx` を実装し、`Home.tsx` の `<Nav />` の前に置く**

`useEffect` 内の処理:

- `matchMedia('(max-width: 768px)')`、`(pointer: coarse)`、`(prefers-reduced-motion: reduce)` から `renderSettings()` を求める
- `createRenderer(canvas, buildFragmentSource({ fbmOctaves }))` を呼ぶ。null なら `no-webgl` を付けて終了する
- `watchContextLoss` で喪失時に `no-webgl` を付け、ループを止める
- 毎フレームの処理:
  - `[data-shader-anchor]` の `getBoundingClientRect` を測る
  - `heroFade` / `featureAmount` / `textSide` / `cardSceneRect`（centered は stacked と同じ値）/ `lightTarget` を計算する
  - スポットライトは目標へ毎フレーム 5% ずつ寄せる（モックアップの `*.05`）
  - Uniforms を組み立てて `draw` する
- `animate === false` のとき: ループを回さず `uTime = REDUCED_MOTION_TIME` で 1 回描き、scroll と resize のたびに描き直す
- `visibilitychange` で `document.hidden` の間はループを止める
- resize で canvas の width と height を `innerWidth / innerHeight × pixelRatio` にする
- cleanup ですべてのリスナーを外し、`dispose` を呼ぶ

- [ ] **Step 5: 背景とフォールバックの CSS を追加する（`src/index.css`）**

- `body` に CSS だけのフェルト背景を敷く: `background: radial-gradient(ellipse at 70% 35%, #12261a 0%, var(--bg) 65%) fixed, var(--bg);`。WebGL が無くてもこれが見える
- `.shader-bg { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; display: block; }`
- `.no-webgl .shader-bg { display: none; }`
- `main, footer { position: relative; z-index: 1; }`
- `.hero-cards { align-self: stretch; height: 120px; }`、768px 以下では `height: 90px`

- [ ] **Step 6: テストとビルドを確認する**

Run: `npm test && npm run lint && npm run build`
Expected: すべて PASS。`prerendered dist/index.html` が出力される

- [ ] **Step 7: ブラウザで確認する（Review Focus 1, 2, 4, 5）**

`npm run preview -- --port 4173` を起動し、別のシェルでヘッドレス Chrome を使ってスクリーンショットとコンソールを取る:

```bash
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for u in "" "#features" "#pricing"; do
  "$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --enable-logging=stderr --v=0 \
    --user-data-dir="$(mktemp -d)" --window-size=1280,900 --virtual-time-budget=4000 \
    --screenshot="/tmp/shot-${u#\#}.png" "http://localhost:4173/$u" 2>&1 | grep -i "CONSOLE" | grep -v ReadPixels
done
```

Expected:
- コンソールにシェーダーのエラーがない
- `/`: CTA の下にカード 7 枚が見える（カードは配られている途中か、ワイヤーフレームになっている）
- `/#features`: 演出が出ている（機能の演出の中身は Task 6 まで旧座標でもよい）。Hero のカードは残っていない
- `/#pricing`: Hero の演出がなく、スポットライトがおかしな位置にない

続けて、実ブラウザ（`npm run preview` を開く）で次を手で確認する:
- ウィンドウをリサイズしても演出がスマホ画像に追従し、引き伸ばされない
- App Store ボタン、Nav のリンク、メールリンクがクリックできる
- 別タブに切り替えて戻ると、演出が正しく再開する

- [ ] **Step 8: Commit**

```bash
git add src/components/ShaderBackground.tsx src/entry-server.test.tsx src/pages/Home.tsx src/components/HeroSection.tsx src/components/FeaturesSection.tsx src/index.css
git commit -m "feat: render fixed shader background anchored to page elements"
```

---

### Task 5: セクションスタイルの刷新

**Files:**
- Modify: `src/index.css`, `src/components/FeaturesSection.tsx`, `src/components/PricingSection.tsx`, `src/components/ContactSection.tsx`
- Test: `src/entry-server.test.tsx`（追記）

**Interfaces:**
- Consumes: Task 4 の DOM（アンカー属性は残す）
- Produces: CSS クラス `.eyebrow`、`.feature-num`

- [ ] **Step 1: 失敗するテストを追記する**

```tsx
  it('adds the eyebrow labels and feature numbers', () => {
    for (const label of ['FEATURES', 'PRICING', 'CONTACT']) {
      expect(html).toContain(`<span class="eyebrow">${label}</span>`)
    }
    for (const n of ['01 / SESSION', '02 / HAND', '03 / BANKROLL', '04 / TRIP']) {
      expect(html).toContain(`<span class="feature-num">${n}</span>`)
    }
  })
```

- [ ] **Step 2: 失敗を確認する**

Run: `npm test -- entry-server`
Expected: FAIL

- [ ] **Step 3: JSX を変える**

- 各 `<h2 className="section-title">` の直前に `<span className="eyebrow">…</span>` を置く
- `FEATURES` 配列に `label: 'SESSION' | 'HAND' | 'BANKROLL' | 'TRIP'` を追加し、`<h3>` の直前に `` <span className="feature-num">{`0${i + 1} / ${f.label}`}</span> `` を置く
- 料金カードなどのそれ以外の構造は変えない

- [ ] **Step 4: CSS を変える（値はモックアップから）**

- `.section-inner` の padding を `120px 24px` に。`.section-title` の margin-bottom を `56px` に
- `.eyebrow`: `display: block; text-align: center; color: var(--gold); font-size: 12px; font-weight: 700; letter-spacing: 4px; margin-bottom: 12px; opacity: .85`
- `.feature-num`: `font-family: ui-monospace, Menlo, monospace; color: var(--gold); font-size: 13px; letter-spacing: 2px; opacity: .8`
- `.features` と `.contact` の `background` を削除する
- `.feature-row` の区切り線: `1px solid rgba(201,168,76,.1)`
- `.iphone-frame` と `.iphone-frame-md`:
  - 固定の width/height と `::before` を削除する
  - `border: 1px solid rgba(201,168,76,.28)`、`background: rgba(8,12,10,.8)`、`box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 60px rgba(201,168,76,.08)`
  - padding: 大 `14px`／中 `12px`。角丸: 大 `48px`／中 `40px`
  - 画像: 大 `width: 300px; border-radius: 36px`（768px 以下は `240px`）／中 `width: 220px; border-radius: 30px`（768px 以下は `184px`）。`height: auto`、`object-fit` は削除
- `.nav--scrolled`: `background: rgba(8,13,10,.6); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(201,168,76,.12)`
- `.btn-appstore`: `box-shadow: 0 0 30px rgba(201,168,76,.25)`
- `.pricing-card` と `.pricing-table`:
  - `background: rgba(10,18,13,.55); backdrop-filter: blur(16px); border: 1px solid rgba(201,168,76,.15); border-radius: 18px`
  - 表は `overflow: hidden` を付け、行の線を `rgba(201,168,76,.08)` にする
- `.pricing-card--highlight`: `border-color: var(--gold); box-shadow: 0 0 0 1px rgba(201,168,76,.4), 0 0 60px rgba(201,168,76,.12)`
- `.pricing-card li::before` の content を `'♠'` に（`font-size: 11px`）
- `.footer`: `border-top: 1px solid rgba(201,168,76,.1)`

- [ ] **Step 5: テストとビルドを確認する**

Run: `npm test && npm run lint && npm run build`
Expected: PASS

- [ ] **Step 6: 目視で確認する**

Task 4 Step 7 のコマンドで撮影し、モックアップ（`docs/superpowers/specs/assets/2026-10-17-shader-mockup.html`）と見比べる。次を確認する:
- 料金カードと表が半透明で、フェルトが透けている
- 見出しの上に英字ラベルがある
- スマホ枠が金の細い縁になっている

- [ ] **Step 7: Commit**

```bash
git add src/index.css src/components/FeaturesSection.tsx src/components/PricingSection.tsx src/components/ContactSection.tsx src/entry-server.test.tsx
git commit -m "feat: restyle sections for the shader background"
```

---

### Task 6: 機能演出の仕上げ（デスクトップの向きとモバイルの縦並び）

**Files:**
- Modify: `src/shaders/features.glsl`, `src/shaders/hero.glsl`（必要なら）, `src/components/ShaderBackground.tsx`（必要なら）

**Interfaces:**
- Consumes: `uStacked`、`uFSide`、`uF0`〜`uF3`

- [ ] **Step 1: デスクトップの向きを確認する**

1280×900 で各機能を画面中央にして撮影する。`/#features` から 650px ずつ下へスクロールした状態を、実ブラウザか Task 4 の方法で用意する。Expected:
- 03 のグラフと 04 の航路が説明文の側へ伸びている（左右交互に反転している）
- 01 の文字盤と 02 のカードがスマホを中心に出ている

- [ ] **Step 2: 縦並び（`uStacked == 1`）の描き分けを実装する**

`features.glsl` で、`uStacked > .5` のときの扱い:
- 01 と 02 はそのまま（スマホ中心で対称）
- 03 と 04 は、横の範囲（グラフは局所 x `-0.2..2.4`、航路は `0.35..2.1`）を、ビューポート幅の 90% に収まるよう縮める。スマホの中心に合わせて中央に置き、スマホの下端（局所 y `-0.5`）から下へ出す。縮め率は `uRes.x / f.z`（スマホの高さを単位にしたビューポート幅）から求める

- [ ] **Step 3: モバイル幅で確認する**

Task 4 Step 7 のコマンドを `--window-size=390,844` にして、`/`、`/#features` と、そこから各機能までスクロールした状態を撮影する。Expected:
- Hero のカード 7 枚が CTA の下で画面幅に収まり、中央に揃っている
- 光の粒が上のスマホへ向かう
- 03 と 04 の演出が画面の横幅からはみ出さず、機能の見出し（h3）に重ならない
- コンソールにエラーがない

- [ ] **Step 4: テストとビルドを確認する**

Run: `npm test && npm run lint && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shaders src/components/ShaderBackground.tsx
git commit -m "feat: adapt feature effects to stacked mobile layout"
```

- [ ] **Step 6: ユーザーの実機確認を依頼する**

ユーザーに iPhone での確認を依頼する（spec の「実機確認」）。重い・熱いという報告があれば、spec で合意した順で調整する: (1) dpr 1（実装済み）→ (2) モバイルの `fbmOctaves` を 3 から 2 へ → (3) `renderSettings` のモバイルの `maxFps` を 30 にし、`ShaderBackground` で前回の描画から 1/maxFps 秒経っていないフレームを飛ばす。
