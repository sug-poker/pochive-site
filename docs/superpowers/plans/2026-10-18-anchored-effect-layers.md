# 演出レイヤー分離 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スマホ画像に追従する演出（Hero の輪郭と機能 4 つ）を、ページと一緒にスクロールする canvas に移し、iOS でのスクロール時の上下のブレをなくす。

**Architecture:**
- 固定背景の canvas は、フェルト、スポットライト、型押しスートだけを描く。
- 演出は、各セクションに置いた `canvas.shader-layer` で描く。描画範囲は、横がビューポート全幅、縦がスマホ画像の高さの 1.8 倍。
- レイヤーの位置とサイズは、レイアウトが変わったとき（リサイズ、画像の読み込み）だけ計算する。毎フレーム渡すのは、時刻、強さ（`heroFade`/`featureAmount`）、ビネット用の画面上の位置だけ。
- WebGL コンテキストはレイヤーごとに持つ。描画ループは背景と共通。

**Tech Stack:** React 19, TypeScript, Vite 8, WebGL1, Vitest

**Spec:** `docs/superpowers/specs/2026-10-17-shader-redesign-design.md`（「描画の構成：固定背景＋スクロールするレイヤー（2026-10-18 改訂）」）

## Global Constraints

- 既存プランの Global Constraints はすべて有効
- 見た目（線、明るさ、動き、モバイルでの縦向きの輪郭や `fitBand`）は今と同じにする。違ってよいのは、光の点のいちばん明るい所が金で頭打ちになることだけ
- レイヤーは文字より後ろ、固定背景より前に置く。`pointer-events: none`、`aria-hidden="true"`
- 描く頻度は `renderSettings().maxFps` に従う（スマホは常に 30fps）。前回入れた「スクロール中は毎フレーム描画」は外す
- 背景の WebGL が使えなければ `no-webgl`（レイヤーも隠す）。レイヤーだけ失敗・喪失した場合は、そのレイヤーだけを隠す

## Review Focus

1. **スクロール中の位置:** 演出がスマホ画像と一緒に動き、ずれないこと（レイヤーの位置を毎フレーム書き換えていないこと）→ Task 3 の検証
2. **重なり順:** レイヤーが文字の上に出ず、固定背景より前にあり、ボタンやリンクのクリックを妨げないこと → Task 3 の検証
3. **画像の読み込み後のレイアウト変化:** スマホ画像が遅れて読み込まれて高さが変わっても、レイヤーが付いてくること → Task 3 の実装（ResizeObserver）と検証
4. **一部のレイヤーの失敗:** 1 枚だけ失敗しても、他と背景はそのまま動くこと → Task 2 のテスト
5. **モバイル:** 縦向きの輪郭、文字盤の縮小、`fitBand` が今と同じに出ること → Task 3 の検証

---

### Task 1: 計算とシェーダーの組み立て

**Files:** `src/background/scene.ts`（＋テスト）, `src/background/shaderSource.ts`（＋テスト）, `src/shaders/common.glsl`, `src/shaders/background.frag.glsl`, `src/shaders/features.glsl`, 新規 `src/shaders/layer-uniforms.glsl`, 新規 `src/shaders/layer.frag.glsl`

**Interfaces（Produces）:**
- `LAYER_HEIGHT = 1.8`
- `layerBox(container: {left:number; top:number}, phone: {left:number; top:number; width:number; height:number}, viewportWidth: number): { left: number; top: number; width: number; height: number; phone: [number, number, number] }`
  - left/top/width/height は container 基準の CSS px
  - phone はレイヤー内の CSS px で、`(中心 x, 中心 y を上から測った値, 高さ)`
- `frameDue(now, lastDrawn, maxFps)` は引数 `scrolling` をなくして 3 引数に戻す
- `buildBackgroundSource({ fbmOctaves }): string` は common と background.frag を連結する
- `buildLayerSource({ fbmOctaves }): string` は common、layer-uniforms、hero、features、layer.frag を連結する
- `buildFragmentSource` は削除する
- ユニフォーム:
  - 背景: `uRes`, `uTime`, `uLight`, `uHero`
  - レイヤー: `uRes`, `uTime`, `uPhone`（vec3: 中心はデバイス px で y 上向き、高さ）, `uStacked`, `uKind`（0 = Hero、1〜4 = 機能 01〜04）, `uSide`, `uAmount`, `uView`（vec4: レイヤー左下の画面上の位置（デバイス px、y 上向き）と、ビューポートのサイズ）

- [ ] **Step 1: テストを書く**
  - `layerBox` のテスト:
    - `layerBox({left: 100, top: 2000}, {left: 140, top: 2040, width: 248, height: 520}, 1280)` → `{ left: -100, top: -168, width: 1280, height: 936, phone: [264, 468, 520] }`
  - `frameDue` のテスト: 3 引数版に戻す
  - shaderSource のテスト:
    - 背景のソースに `heroTrack(` と `featureFx(` が含まれないこと
    - 背景のソースが `uLight`／`uHero` を宣言していること
    - レイヤーのソースに `vec3 heroTrack(`、`vec3 fxSession(`、`void main(` が 1 回ずつ含まれること
    - レイヤーのソースが `uPhone`／`uStacked`／`uKind`／`uSide`／`uAmount`／`uView` を宣言していること
    - レイヤーのソースが premultiplied alpha を出力すること（`gl_FragColor = vec4(col, a)`）
    - `heroTrack` から `featureFx(` までの間に `uStacked` が含まれること（既存のテストを、新しいソースに合わせて残す）
- [ ] **Step 2: 失敗を確認する**（`npm test`）
- [ ] **Step 3: 実装する**
  - layer.frag の `main` は、今の `featureFx` と `heroTrack * uHero` の分岐を `uKind` で選ぶ形に移す。`f = vec4(uPhone, 1.)` とし、Hero の light は 0.5 で固定する
  - 最後に `col *= uAmount * ビネット` をかける。ビネットは `uv = (gl_FragCoord.xy + uView.xy) / uView.zw` で求める
  - 出力は `col = clamp(col,0.,1.); a = max(r,g,b); gl_FragColor = vec4(col, a)`
- [ ] **Step 4: テストが通ることを確認する**

### Task 2: 汎用レンダラー

**Files:** `src/background/renderer.ts`（＋テスト）

**Interfaces（Produces）:**
- `type UniformValue = number | readonly number[]`
- `createRenderer(canvas, fragmentSource, options?: { transparent?: boolean }): Renderer | null`
  - `transparent` のときは `{ alpha: true, premultipliedAlpha: true }`
- `Renderer.draw(uniforms: Record<string, UniformValue>)`
  - location は名前ごとにキャッシュする。値の長さに応じて `uniform1f`〜`uniform4f` を呼ぶ
- `watchContextLoss` は今のまま

- [ ] **Step 1: テストを書く**
  - 既存の null 経路のテスト
  - `getContext` に渡された属性を記録するフェイクを使い、`transparent: true` で `alpha: true, premultipliedAlpha: true` を要求すること（コンテキストは null を返す）
- [ ] **Step 2: 失敗を確認する。Step 3: 実装する。Step 4: テストが通ることを確認する**
- [ ] **Step 5: Commit（Task 1 と 2 をまとめて）**

### Task 3: レイヤーの配置と描画ループ

**Files:** `src/components/ShaderBackground.tsx`, `src/components/HeroSection.tsx`, `src/components/FeaturesSection.tsx`, `src/index.css`, `src/entry-server.test.tsx`

**Interfaces（Produces）:**
- マークアップ:
  - `.hero` の先頭の子に `<canvas className="shader-layer" data-shader-layer="hero" aria-hidden="true" />` を置く
  - 各 `.feature-row` の先頭の子に `data-shader-layer="feature"` の canvas を置く

- [ ] **Step 1: SSR テストを書く**
  - `class="shader-layer"` の canvas が 5 つあること
  - `data-shader-layer="hero"` が 1 つ、`"feature"` が 4 つあること
  - すべて `aria-hidden="true"` であること
- [ ] **Step 2: 失敗を確認する**
- [ ] **Step 3: マークアップと CSS を書く**
  - `.hero` と `.feature-row` に `position: relative` を付ける
  - `.shader-layer` は `position: absolute; z-index: -1; pointer-events: none; display: block`
  - `.no-webgl .shader-layer` は `display: none`
- [ ] **Step 4: ShaderBackground を書き換える**
  - 背景は `buildBackgroundSource` で描き、ユニフォームは `uRes/uTime/uLight/uHero` だけにする
  - レイヤーは `canvas[data-shader-layer]` をすべて集める。それぞれの `kind`（Hero は 0、機能は DOM 順に 1〜4）、container（`parentElement`）、phone（container 内の `[data-shader-anchor]`）を持つ
  - `createRenderer(.., { transparent: true })` が null を返したり、コンテキストが失われたりしたら、そのレイヤーの canvas を `hidden` にする
  - `layout()` で各レイヤーの `layerBox` を求め、style、バッファサイズ（`canvasSize`）、`uPhone`、`uSide` を更新する。呼ぶのは次のとき:
    - マウント時
    - window の resize
    - container と phone を対象にした `ResizeObserver` のコールバック
  - IntersectionObserver で、画面に入っているレイヤーだけを描く
  - 毎フレーム、強さを求める（Hero は `heroFade`、機能は `featureAmount`）。強さが 0.001 以下で、前回も 0.001 以下なら描かない
  - 毎フレーム、レイヤーの `getBoundingClientRect()` から `uView` を求める
  - ループは `frameDue(now, lastDrawn, maxFps)` を使う
- [ ] **Step 5: テスト、型、lint、ビルドを確認する**
- [ ] **Step 6: ブラウザで確認する**（DevTools プロトコル）
  - **1280×900 と 390×844:** 各演出の見た目が以前と同じであること
  - **スクロール:** スクロールしながら（`scrollTo` を少しずつ）、レイヤーの `getBoundingClientRect().top` とスマホ画像の `top` の差が変わらないこと
  - **クリック:** `elementFromPoint` で、CTA、Nav、メールリンクに当たること
  - **reduced motion と WebGL 無効:** これまでどおりの挙動であること
- [ ] **Step 7: Commit、push、PR を作成する**
