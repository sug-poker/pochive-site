# Hero テーブル演出 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hero の「カード 7 枚の配布と走査」演出を、線画のポーカーテーブルで 1 ハンドをプレイし、それがスマホ（実スクショの切り替え）へ記録される演出に置き換える。

**Architecture:** 既存の `ShaderBackground` の仕組み（アンカー計測 → ユニフォーム → シェーダー）をそのまま使う。変更点は 3 つ。(1) `hero-cards` アンカーを、縦横比が固定の `hero-table` アンカーに置き換える。(2) `hero.glsl` をテーブル演出に差し替える。(3) シェーダーと同じ時計で、Hero のスマホの DOM（スクショ切り替えと縁の光）を動かす。タイムラインは純粋関数 `heroPhoneState()` に切り出してテストする。

**Tech Stack:** React 19, TypeScript, Vite 8, WebGL1, Vitest

**Spec:** `docs/superpowers/specs/2026-10-17-shader-redesign-design.md`（「Hero 演出：テーブルでのプレイが記録になる（2026-10-17 改訂）」の節）
**見た目の正:** `docs/superpowers/specs/assets/2026-10-17-hero-table-mockup.html`。移植元はシェーダーの `uStyle == 2`（線画）と `mode == 3` の分岐だけ。他の style/mode の分岐は比較用の残骸なので移植しない

## Global Constraints

- 既存プラン `docs/superpowers/plans/2026-10-17-shader-redesign.md` の Global Constraints はすべて有効
- Hero のテーブル、席、チップ、カード、ディーラーボタンは塗りなしの金の線だけで描く（モックアップの線画）。赤・白・黒は使わない
- スマホ画像は `public/screenshots/hands.png` と `bankroll.png` だけを使う。アプリを模した HTML 画面は作らない
- ループは 17 秒。タイムラインの値はモックアップの `LOG` とシェーダーの `actTime`/`betT`/`boardT`/`SHOWDOWN`/`WIN` と同じにする
- モバイル（`max-width: 768px`）の並びは、スマホ画像 → テーブル → 文字。スマホ画像の幅は 200px
- ポジション名は 768px 以下と `.no-webgl` では表示しない

## Review Focus

1. **スマホの縦並び:** 390×844 で、スマホ画像とテーブルの両方が初期表示の画面に収まること → Task 3 の検証
2. **ループの境目:** T が 17 → 0 に戻るとき、スマホ画像が「ハンド記録」に戻り、縁の光が残らないこと → Task 1 のテスト
3. **reduced motion:** 静止フレームで収支画面が表示され、縁は光らないこと → Task 1 のテスト、Task 3 の検証
4. **WebGL なし:** `hands.png` の静止表示になり、ポジション名が隠れ、テーブルの場所は空くこと → Task 3 の検証
5. **ハイドレーション:** スクショの切り替えは DOM の class/属性の操作だけで行い、React の state は使わないこと（プリレンダー結果と一致させるため）→ Task 2 の実装

---

### Task 1: タイムラインとテーブルの場の計算

**Files:**
- Modify: `src/background/scene.ts`
- Test: `src/background/scene.test.ts`

**Interfaces:**
- Produces（`src/background/scene.ts`）:
  - `HERO_LOOP = 17`
  - `TABLE_SCENE_ASPECT = 2.3`
  - `tableSceneRect(anchor: Rect): { centerX: number; centerY: number; unit: number }`（unit = `min(height, width / TABLE_SCENE_ASPECT)`）
  - `heroPhoneState(time: number): { screen: 'hands' | 'bankroll'; ping: boolean }`（time は秒。内部で `% HERO_LOOP`）
  - `REDUCED_MOTION_TIME = 15.8`（値を変更する）
- Removes: `CARD_SCENE_WIDTH`, `cardSceneRect`（使っている箇所は Task 2 で置き換える）

- [ ] **Step 1: テストを書き換える**

`cardSceneRect` の describe を削除し、次を追加する:

```ts
describe('tableSceneRect', () => {
  it('centres the scene in the anchor and uses its height as the unit', () => {
    expect(tableSceneRect({ left: 100, top: 600, width: 460, height: 200 })).toEqual({ centerX: 330, centerY: 700, unit: 200 })
  })
  it('shrinks the unit when the anchor is narrower than 2.3:1', () => {
    expect(tableSceneRect({ left: 0, top: 0, width: 230, height: 200 }).unit).toBeCloseTo(100)
  })
})

describe('heroPhoneState', () => {
  it('shows the hand log during the hand and the bankroll after the pot lands', () => {
    expect(heroPhoneState(5).screen).toBe('hands')
    expect(heroPhoneState(14.6).screen).toBe('bankroll')
    expect(heroPhoneState(16.79).screen).toBe('bankroll')
    expect(heroPhoneState(16.8).screen).toBe('hands')
  })
  it('wraps every 17 seconds back to the hand log', () => {
    expect(heroPhoneState(17 + 5).screen).toBe('hands')
    expect(heroPhoneState(17 + 15).screen).toBe('bankroll')
  })
  it('pings for 0.22s when a packet lands: actions +1.0s, streets and showdown +1.2s, the pot at 14.7s', () => {
    expect(heroPhoneState(2.0).ping).toBe(true)    // BTN raise at 1.0
    expect(heroPhoneState(2.25).ping).toBe(false)
    expect(heroPhoneState(4.65).ping).toBe(true)   // flop at 3.4
    expect(heroPhoneState(14.4).ping).toBe(true)   // showdown at 13.2
    expect(heroPhoneState(14.75).ping).toBe(true)  // pot
    expect(heroPhoneState(0.5).ping).toBe(false)
  })
  it('the reduced-motion still shows the bankroll without a ping', () => {
    expect(heroPhoneState(REDUCED_MOTION_TIME)).toEqual({ screen: 'bankroll', ping: false })
  })
})
```

import 文も合わせて変える。

- [ ] **Step 2: 失敗を確認する**

Run: `npm test -- scene`
Expected: FAIL（`tableSceneRect` と `heroPhoneState` がない）

- [ ] **Step 3: 実装する**

着地時刻は次のとおり:
- アクション（1.0, 2.0, 4.6, 5.4, 6.3, 8.6, 9.4, 11.0, 11.9）の各 +1.0 秒
- ストリートとショーダウン（3.4, 7.6, 10.0, 13.2）の各 +1.2 秒
- ポットは 14.7 秒

ping は、どれかの着地時刻 t について `t <= T < t + 0.22` のとき true。screen は `14.6 <= T < 16.8` のとき `'bankroll'`。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- scene`
Expected: PASS

（`cardSceneRect` を使っている `ShaderBackground` は Task 2 で直す。この時点では `tsc` が落ちるので、コミットは Task 2 とまとめる）

---

### Task 2: テーブルのシェーダーと時計の同期

**Files:**
- Replace: `src/shaders/hero.glsl`
- Modify: `src/shaders/common.glsl`（`uCards` を `uTable` に）, `src/shaders/background.frag.glsl`（`heroDeal` を `heroTable` に）, `src/background/renderer.ts`（`cards` を `table` に）, `src/background/shaderSource.test.ts`, `src/components/ShaderBackground.tsx`

**Interfaces:**
- Consumes: Task 1 の `tableSceneRect`, `heroPhoneState`, `HERO_LOOP`
- Produces:
  - ユニフォーム `uniform vec3 uTable;` = (中心 x, 中心 y, unit)。デバイス px、y は上向き
  - GLSL `vec3 heroTable(vec2 p, float light)`。加算するだけの色を返し、呼び出し側で `* uHero` する
  - `Uniforms.table: [number, number, number]`（`cards` を置き換える）
  - DOM: Hero のスマホ要素（`data-shader-anchor="hero-phone"`）に `data-screen="hands|bankroll"` 属性を付け、`is-ping` クラスを付け外しする

- [ ] **Step 1: shaderSource のテストを更新する**

- 期待する関数名を `'vec3 heroDeal('` から `'vec3 heroTable('` に変える
- ユニフォームの一覧の `'uCards'` を `'uTable'` に変える
- 次のケースを追加する:

```ts
  it('the hero is a line-art table, not the old card scan', () => {
    expect(src).toContain('float sdTable(')
    expect(src).not.toMatch(/BEAM_FROM|uCards/)
  })
```

テスト「never draws grid pulses, chips or the table oval」の正規表現 `/pulseX|chip\(|rail/` は、Hero の線画チップとレールにも当たってしまう（spec の補足で Hero には当てはまらないと確認済み）。`/pulseX/` だけに緩める。

- [ ] **Step 2: 失敗を確認する**

Run: `npm test -- shaderSource`
Expected: FAIL

- [ ] **Step 3: `hero.glsl` を移植する**

移植元はモックアップの線画分岐。モックアップの座標（「m 空間」）はそのまま使い、入力を変換する。

```glsl
vec2 toM(vec2 p){ return C + (p - toP(uTable.xy)) / (uTable.z/uRes.y) * .46; }
```

`heroTable` の中では、`p` と Hero のスマホの位置（`toP(uPhone)`）を両方 `toM` で変換してから、モックアップと同じ計算をする。`.46` は、モックアップの場の高さ（シーン全体）を m 空間で表した値。

移植するもの:
- 定数とレイアウト: `C, TILT, L, RR, RAIL, R, toT, fromT, sdTable, seatT, seatPos, betPos, potPos`
- タイムライン関数
- `drawCard`: 線画だけ。wire=1 相当、`a*.65`
- 線画のテーブル、席、ディーラーボタン
- チップ: 輪だけ
- アクションとストリートの光の粒: 強さ `*(1-.4)`
- ポットの光の流れ: mode 3
- `fadeAll`

移植しないもの: 部屋のフェルト、スポットライト、ビネット（`background.frag.glsl` 側にある）。`light` は引数で受け取る。

`background.frag.glsl` の `heroDeal(p, light) * uHero` を `heroTable(p, light) * uHero` に変える。`common.glsl` の `uniform vec3 uCards;` を `uniform vec3 uTable;` に変える。

- [ ] **Step 4: renderer と ShaderBackground を更新する**

renderer:
- `UNIFORM_NAMES` の `uCards` を `uTable` に変える
- `Uniforms.cards` を `table` に変える

ShaderBackground:
- アンカーを `hero-cards` から `hero-table` に変える
- `tableSceneRect` の中心と `unit` をデバイス px に変換して `table` に渡す
- 毎フレーム `const t = time`（reduced motion なら `REDUCED_MOTION_TIME`）について `heroPhoneState(t)` を求める。スマホ要素の `dataset.screen` が変わったときだけ書き換え、`classList.toggle('is-ping', ping)` を呼ぶ

- [ ] **Step 5: テスト、型、lint を確認する**

Run: `npm test && npx tsc -b && npm run lint`
Expected: PASS。`entry-server.test.tsx` の `hero-cards` の検査は Task 3 で直すので、ここでは 1 件だけ FAIL してよい

- [ ] **Step 6: Commit（Task 1 と 2）**

```bash
git add src/background src/shaders src/components/ShaderBackground.tsx
git commit -m "feat: replace hero card scan with a line-art poker table shader"
```

---

### Task 3: Hero のマークアップと CSS（デスクトップとモバイル）

**Files:**
- Modify: `src/components/HeroSection.tsx`, `src/index.css`, `src/entry-server.test.tsx`

**Interfaces:**
- Consumes: Task 2 の `data-screen` と `is-ping`
- Produces:
  - アンカー `<div className="hero-table" data-shader-anchor="hero-table" aria-hidden="true">`。中に 6 つの `<span className="hero-seat">`（BTN だけ `hero-seat hero-seat--me`）を置く
  - スマホ要素の中に `<img className="iphone-screen hero-shot hero-shot--hands">` と `<img className="iphone-screen hero-shot hero-shot--bankroll">`

- [ ] **Step 1: SSR テストを更新する**

`hero-cards` の検査を次に置き換える:

```tsx
  it('renders the hero table scene with six seat labels and both phone screenshots', () => {
    expect(html.match(/data-shader-anchor="hero-table"/g)).toHaveLength(1)
    for (const seat of ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']) expect(html).toContain(`>${seat}</span>`)
    expect(html).toContain('/screenshots/hands.png')
    expect(html).toContain('/screenshots/bankroll.png')
    expect(html).toMatch(/data-shader-anchor="hero-phone"[^>]*data-screen="hands"|data-screen="hands"[^>]*data-shader-anchor="hero-phone"/)
  })
```

- [ ] **Step 2: 失敗を確認する**

Run: `npm test -- entry-server`
Expected: FAIL

- [ ] **Step 3: HeroSection を組み替える**

`.hero` の子を `hero-content`（バッジ〜CTA）、`hero-table`、スマホ要素の 3 つにする。スマホ要素には `data-screen="hands"` を付け、画像は 2 枚とも `alt` 付きにする（`hands` は「Pochive ハンド記録画面」、`bankroll` は「Pochive バンクロール・統計画面」）。

ポジション名の位置はモックアップの JS と同じ式で求め、インラインの `left`/`top` に %（アンカー基準）で書く。席の t 空間座標を `(x, y)` として:
- `left = 50% + x*1.2/.46/2.3*100%`
- `top = 50% - y*1.2*.42/.46*100%`

- [ ] **Step 4: CSS を書く**

- `.hero` をグリッドにする:
  - デスクトップ: `grid-template-columns: 1fr auto; grid-template-areas: "content phone" "table phone"`、`column-gap: 64px`、`align-items: center`
  - 768px 以下: `grid-template-columns: 1fr; grid-template-areas: "phone" "table" "content"`、`justify-items: center`、`row-gap: 24px`
- `.hero-table`: `grid-area: table; position: relative; width: 100%; max-width: 560px; aspect-ratio: 2.3 / 1;`。768px 以下は `max-width: 390px`
- `.hero-seat`: `position: absolute; transform: translate(-50%, -50%); font: 700 9px ui-monospace, Menlo, monospace; letter-spacing: 1.5px; color: var(--muted); opacity: .8`。`--me` は `color: var(--gold); opacity: 1`
  - 768px 以下と `.no-webgl` では `display: none`
- スマホ要素:
  - `position: relative`。2 枚の画像を重ね、2 枚目は `position: absolute; inset: 14px`
  - `opacity` を `.6s` でクロスフェードする。`[data-screen="hands"] .hero-shot--bankroll` と `[data-screen="bankroll"] .hero-shot--hands` を `opacity: 0` にする
  - `.is-ping`: `box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(201,168,76,.7), 0 0 50px rgba(201,168,76,.35); transition: box-shadow .08s`
  - 768px 以下は `.iphone-screen { width: 200px }`
- 古い `.hero-cards` の CSS を削除する

- [ ] **Step 5: テストとビルドを確認する**

Run: `npm test && npm run lint && npm run build`
Expected: PASS

- [ ] **Step 6: ブラウザで確認する**

`npm run preview` を起動し、DevTools プロトコルで撮影する。Expected:
- **1280×900:** 文字の下に線画のテーブル、右にスマホ画像。ハンド中はスマホがハンド記録で、決着後は収支画面になる。席の光と光の粒が出ている
- **390×844:** 初期表示の画面に、スマホ画像とテーブルの両方が入っている。ポジション名は出ていない
- **reduced motion:** 収支画面で静止している
- **WebGL 無効:** `hands.png` が表示され、ポジション名は出ていない
- コンソールにエラーがない

- [ ] **Step 7: Commit**

```bash
git add src/components/HeroSection.tsx src/index.css src/entry-server.test.tsx
git commit -m "feat: lay out the hero table scene and phone screenshot switching"
```
