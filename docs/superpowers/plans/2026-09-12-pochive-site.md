# Pochive サイト 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pochive iOS アプリの紹介用ランディングページを構築する（Hero / 機能 / 料金 / お問い合わせ）

**Architecture:** フル SPA（1 ページ構成）。セクション間はアンカーリンクでスクロール。React Router は使用しない。既存の `privacy-policy.html` / `terms.html` は standalone HTML のまま流用。

**Tech Stack:** React 19, TypeScript, Vite, CSS（グローバル）、`@pochive/plans`（プランデータ）

**Spec:** `docs/superpowers/specs/2026-09-12-pochive-site-design.md`

## Global Constraints

- `vite.config.ts` の `base: '/pochive-site/'` は変更しない
- `public/` 内の既存ファイル（`privacy-policy.html`, `terms.html`, `404.html`, `favicon.svg`）は変更しない
- カラー: `--bg: #0a0f0d`, `--surface: #111a14`, `--text: #f0e6c8`, `--gold: #c9a84c`, `--muted: #8a9b8e`, `--border: #1c2b22`
- フォント: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- コンテンツ最大幅: `1100px`
- モバイルファースト（ブレークポイント: `768px`）
- スタイルはすべて `src/index.css` に記述（CSS モジュール不使用）

---

## ファイルマップ

| ファイル | 変更種別 | 役割 |
|---|---|---|
| `src/index.css` | 修正 | CSS 変数・リセット・全コンポーネントのスタイル |
| `src/App.tsx` | 修正 | `<Home />` を返すだけに書き換え |
| `src/App.css` | 削除 | `index.css` に統合 |
| `src/pages/Home.tsx` | 新規 | 全セクションを組み合わせるページコンポーネント |
| `src/components/Nav.tsx` | 新規 | ヘッダーナビゲーション（スクロール連動背景） |
| `src/components/HeroSection.tsx` | 新規 | バッジ・ロゴ・CTA・iPhone モックアップ |
| `src/components/FeaturesSection.tsx` | 新規 | 機能カード 2×2 グリッド |
| `src/components/PricingSection.tsx` | 新規 | Free / Analyzer 比較（`@pochive/plans` 使用） |
| `src/components/ContactSection.tsx` | 新規 | メールアドレス掲載 |
| `src/components/Footer.tsx` | 新規 | コピーライト・法的リンク |

---

## Task 1: 作業ブランチの作成

**Files:**
- なし（git のみ）

- [ ] **Step 1: ブランチを作成して切り替える**

```bash
git checkout -b feature/landing-page
```

- [ ] **Step 2: ブランチ確認**

```bash
git branch
```
Expected: `* feature/landing-page` が表示される

---

## Task 2: CSS 基盤 + App.tsx 書き換え + Home.tsx 雛形

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Delete: `src/App.css`
- Create: `src/pages/Home.tsx`

**Interfaces:**
- Produces: `Home` default export（後続タスクがここにコンポーネントを追加していく）

- [ ] **Step 1: `src/index.css` を書き換える**

```css
:root {
  --bg: #0a0f0d;
  --surface: #111a14;
  --text: #f0e6c8;
  --gold: #c9a84c;
  --muted: #8a9b8e;
  --border: #1c2b22;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

/* ── Shared ── */

.section-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 96px 24px;
}

.section-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 48px;
  text-align: center;
}

.badge {
  display: inline-block;
  background-color: var(--surface);
  color: var(--gold);
  border: 1px solid rgba(201, 168, 76, 0.27);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* ── iPhone mockup ── */

.iphone-frame {
  width: 220px;
  height: 440px;
  border: 2px solid var(--border);
  border-radius: 36px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.iphone-frame::before {
  content: '';
  position: absolute;
  top: 14px;
  width: 60px;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
}

.iphone-screen {
  width: 182px;
  height: 370px;
  background: var(--bg);
  border-radius: 26px;
}

.iphone-frame-sm {
  width: 72px;
  height: 130px;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.iphone-frame-sm::before {
  content: '';
  position: absolute;
  top: 6px;
  width: 22px;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
}

.iphone-screen-sm {
  width: 56px;
  height: 104px;
  background: var(--bg);
  border-radius: 10px;
}
```

- [ ] **Step 2: `src/App.tsx` を書き換える**

```tsx
import Home from './pages/Home'

export default function App() {
  return <Home />
}
```

- [ ] **Step 3: `src/pages/Home.tsx` を作成する**

```tsx
export default function Home() {
  return (
    <div>
      <p style={{ padding: 32, color: 'var(--gold)' }}>Pochive — building…</p>
    </div>
  )
}
```

- [ ] **Step 4: `src/App.css` を削除する**

```bash
rm /Users/yuta/Documents/poker/pochive-site/src/App.css
```

- [ ] **Step 5: ビルドが通ることを確認する**

```bash
cd /Users/yuta/Documents/poker/pochive-site && npm run build
```
Expected: エラーなし

- [ ] **Step 6: コミットする**

```bash
git add src/index.css src/App.tsx src/pages/Home.tsx && git rm src/App.css && git commit -m "feat: add CSS foundation and Home page scaffold"
```

---

## Task 3: Nav コンポーネント

**Files:**
- Modify: `src/index.css`（Nav スタイル追記）
- Create: `src/components/Nav.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: なし
- Produces: `Nav` default export

- [ ] **Step 1: Nav スタイルを `src/index.css` 末尾に追記する**

```css
/* ── Nav ── */

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  transition: background 0.25s, backdrop-filter 0.25s;
}

.nav--scrolled {
  background: rgba(10, 15, 13, 0.85);
  backdrop-filter: blur(12px);
}

.nav-logo {
  font-size: 20px;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 32px;
}

.nav-links a {
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  transition: color 0.15s;
}

.nav-links a:hover {
  color: var(--text);
}

@media (max-width: 768px) {
  .nav-links {
    gap: 20px;
  }
  .nav-links a {
    font-size: 13px;
  }
}
```

- [ ] **Step 2: `src/components/Nav.tsx` を作成する**

```tsx
import { useState, useEffect } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <a href="#" className="nav-logo">Pochive</a>
      <ul className="nav-links">
        <li><a href="#features">機能</a></li>
        <li><a href="#pricing">料金</a></li>
        <li><a href="#contact">お問い合わせ</a></li>
      </ul>
    </nav>
  )
}
```

- [ ] **Step 3: `src/pages/Home.tsx` に Nav を追加する**

```tsx
import Nav from '../components/Nav'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <p style={{ padding: '120px 32px', color: 'var(--gold)' }}>Pochive — building…</p>
      </main>
    </>
  )
}
```

- [ ] **Step 4: ビルド確認**

```bash
cd /Users/yuta/Documents/poker/pochive-site && npm run build
```
Expected: エラーなし

- [ ] **Step 5: コミットする**

```bash
git add src/index.css src/components/Nav.tsx src/pages/Home.tsx && git commit -m "feat: add Nav component"
```

---

## Task 4: HeroSection コンポーネント

**Files:**
- Modify: `src/index.css`（Hero スタイル追記）
- Create: `src/components/HeroSection.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: なし
- Produces: `HeroSection` default export

- [ ] **Step 1: Hero スタイルを `src/index.css` 末尾に追記する**

```css
/* ── Hero ── */

.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 64px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 120px 24px 80px;
}

.hero-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-logo {
  font-size: 72px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -3px;
  line-height: 1;
}

.hero-tagline {
  font-size: 28px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: -0.5px;
}

.hero-desc {
  font-size: 16px;
  color: var(--muted);
  line-height: 1.75;
  max-width: 420px;
}

.btn-appstore {
  display: inline-block;
  background-color: var(--gold);
  color: var(--bg);
  font-size: 15px;
  font-weight: 700;
  padding: 14px 28px;
  border-radius: 12px;
  align-self: flex-start;
  transition: opacity 0.15s;
}

.btn-appstore:hover {
  opacity: 0.85;
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column-reverse;
    text-align: center;
    align-items: center;
    padding-top: 100px;
    gap: 40px;
  }

  .hero-content {
    align-items: center;
  }

  .hero-logo {
    font-size: 52px;
  }

  .hero-tagline {
    font-size: 22px;
  }

  .hero-desc {
    text-align: center;
  }

  .btn-appstore {
    align-self: center;
  }
}
```

- [ ] **Step 2: `src/components/HeroSection.tsx` を作成する**

```tsx
export default function HeroSection() {
  return (
    <section id="hero">
      <div className="hero">
        <div className="hero-content">
          <span className="badge">App Store 近日公開</span>
          <h1 className="hero-logo">Pochive</h1>
          <p className="hero-tagline">ポーカーを、記録する。</p>
          <p className="hero-desc">
            セッション・ハンド・バンクロールを一元管理。<br />
            あなたのポーカーをデータで支える iOS アプリ。
          </p>
          <a href="#" className="btn-appstore">
            App Store でダウンロード
          </a>
        </div>
        <div className="iphone-frame">
          <div className="iphone-screen" />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `src/pages/Home.tsx` に HeroSection を追加する**

```tsx
import Nav from '../components/Nav'
import HeroSection from '../components/HeroSection'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
      </main>
    </>
  )
}
```

- [ ] **Step 4: ビルド確認**

```bash
cd /Users/yuta/Documents/poker/pochive-site && npm run build
```
Expected: エラーなし

- [ ] **Step 5: コミットする**

```bash
git add src/index.css src/components/HeroSection.tsx src/pages/Home.tsx && git commit -m "feat: add HeroSection component"
```

---

## Task 5: FeaturesSection コンポーネント

**Files:**
- Modify: `src/index.css`（Features スタイル追記）
- Create: `src/components/FeaturesSection.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: なし
- Produces: `FeaturesSection` default export

- [ ] **Step 1: Features スタイルを `src/index.css` 末尾に追記する**

```css
/* ── Features ── */

.features {
  background: var(--surface);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.feature-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-card h3 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
}

.feature-card p {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.65;
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: `src/components/FeaturesSection.tsx` を作成する**

```tsx
const FEATURES = [
  {
    title: 'セッション記録',
    desc: '現金ゲーム・トーナメントのセッションを無制限に記録・管理。入退店時刻・損益を追跡。',
  },
  {
    title: 'ハンド記録',
    desc: 'プレイしたハンドを詳細に記録。GTO Wizard 解析用フォーマットへのエクスポートにも対応。',
  },
  {
    title: 'バンクロール管理',
    desc: '現在残高・推奨 Buy-in・ストップロスを自動計算。入出金履歴で資金を可視化。',
  },
  {
    title: '統計・分析',
    desc: 'P&L グラフ・ドローダウン・ROI・時給など詳細統計で実力を数値化（Analyzer プラン）。',
  },
] as const

export default function FeaturesSection() {
  return (
    <section id="features" className="features">
      <div className="section-inner">
        <h2 className="section-title">機能</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="iphone-frame-sm">
                <div className="iphone-screen-sm" />
              </div>
              <div className="feature-card-body">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `src/pages/Home.tsx` に FeaturesSection を追加する**

```tsx
import Nav from '../components/Nav'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
    </>
  )
}
```

- [ ] **Step 4: ビルド確認**

```bash
cd /Users/yuta/Documents/poker/pochive-site && npm run build
```
Expected: エラーなし

- [ ] **Step 5: コミットする**

```bash
git add src/index.css src/components/FeaturesSection.tsx src/pages/Home.tsx && git commit -m "feat: add FeaturesSection component"
```

---

## Task 6: PricingSection コンポーネント

**Files:**
- Modify: `src/index.css`（Pricing スタイル追記）
- Create: `src/components/PricingSection.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: `COMPARISON_FEATURES: ComparisonFeature[]`, `PLANS: Record<'free'|'analyzer', PlanDefinition>` from `@pochive/plans`
- Produces: `PricingSection` default export

`ComparisonFeature` の型: `{ label: string; free: boolean | string; analyzer: boolean | string }`
`PlanDefinition` の型: `{ tier: string; name: string; features: { label: string; description: string }[] }`

- [ ] **Step 1: Pricing スタイルを `src/index.css` 末尾に追記する**

```css
/* ── Pricing ── */

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.pricing-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pricing-card--highlight {
  border-color: var(--gold);
}

.pricing-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pricing-card h3 {
  font-size: 24px;
  font-weight: 800;
}

.pricing-card ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pricing-card li {
  font-size: 14px;
  color: var(--muted);
  display: flex;
  gap: 8px;
}

.pricing-card li::before {
  content: '✓';
  color: var(--gold);
  font-weight: 700;
  flex-shrink: 0;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.pricing-table th,
.pricing-table td {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid var(--border);
}

.pricing-table th:first-child,
.pricing-table td:first-child {
  text-align: left;
  color: var(--muted);
  width: 50%;
}

.pricing-table th {
  color: var(--gold);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pricing-table td {
  color: var(--text);
}

@media (max-width: 768px) {
  .pricing-cards {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: `src/components/PricingSection.tsx` を作成する**

```tsx
import { COMPARISON_FEATURES, PLANS } from '@pochive/plans'
import type { ComparisonFeature } from '@pochive/plans'

function renderValue(val: boolean | string): string {
  if (val === true) return '✓'
  if (val === false) return '—'
  return val
}

function PlanCard({ tier, highlight }: { tier: 'free' | 'analyzer'; highlight?: boolean }) {
  const plan = PLANS[tier]
  return (
    <div className={`pricing-card${highlight ? ' pricing-card--highlight' : ''}`}>
      <div className="pricing-card-header">
        {highlight && <span className="badge">おすすめ</span>}
        <h3>{plan.name}</h3>
      </div>
      <ul>
        {plan.features.map((f) => (
          <li key={f.label}>{f.label}</li>
        ))}
      </ul>
    </div>
  )
}

function ComparisonTable({ features }: { features: ComparisonFeature[] }) {
  return (
    <table className="pricing-table">
      <thead>
        <tr>
          <th></th>
          <th>無料</th>
          <th>Analyzer</th>
        </tr>
      </thead>
      <tbody>
        {features.map((f) => (
          <tr key={f.label}>
            <td>{f.label}</td>
            <td>{renderValue(f.free)}</td>
            <td>{renderValue(f.analyzer)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function PricingSection() {
  return (
    <section id="pricing" className="pricing">
      <div className="section-inner">
        <h2 className="section-title">料金プラン</h2>
        <div className="pricing-cards">
          <PlanCard tier="free" />
          <PlanCard tier="analyzer" highlight />
        </div>
        <ComparisonTable features={COMPARISON_FEATURES} />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `src/pages/Home.tsx` に PricingSection を追加する**

```tsx
import Nav from '../components/Nav'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import PricingSection from '../components/PricingSection'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>
    </>
  )
}
```

- [ ] **Step 4: ビルド確認**

```bash
cd /Users/yuta/Documents/poker/pochive-site && npm run build
```
Expected: エラーなし

- [ ] **Step 5: コミットする**

```bash
git add src/index.css src/components/PricingSection.tsx src/pages/Home.tsx && git commit -m "feat: add PricingSection component"
```

---

## Task 7: ContactSection + Footer + 最終組み立て

**Files:**
- Modify: `src/index.css`（Contact / Footer スタイル追記）
- Create: `src/components/ContactSection.tsx`
- Create: `src/components/Footer.tsx`
- Modify: `src/pages/Home.tsx`（全セクション組み立て完了）

**Interfaces:**
- Consumes: なし
- Produces: `ContactSection` default export, `Footer` default export
- Produces: `Home.tsx` 完成形

- [ ] **Step 1: Contact / Footer スタイルを `src/index.css` 末尾に追記する**

```css
/* ── Contact ── */

.contact {
  background: var(--surface);
  text-align: center;
}

.contact-desc {
  font-size: 15px;
  color: var(--muted);
  line-height: 1.75;
  margin-bottom: 28px;
}

.contact-email {
  font-size: 20px;
  font-weight: 700;
  color: var(--gold);
  border-bottom: 1px solid rgba(201, 168, 76, 0.4);
  padding-bottom: 2px;
  transition: opacity 0.15s;
}

.contact-email:hover {
  opacity: 0.8;
}

/* ── Footer ── */

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px;
  font-size: 13px;
  color: var(--muted);
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: var(--muted);
  transition: color 0.15s;
}

.footer-links a:hover {
  color: var(--text);
}

@media (max-width: 768px) {
  .footer {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
```

- [ ] **Step 2: `src/components/ContactSection.tsx` を作成する**

```tsx
export default function ContactSection() {
  return (
    <section id="contact" className="contact">
      <div className="section-inner">
        <h2 className="section-title">サポート・お問い合わせ</h2>
        <p className="contact-desc">
          ご不明な点やご意見は、以下のメールアドレスまでお気軽にご連絡ください。
        </p>
        <a href="mailto:sug.apps@gmail.com" className="contact-email">
          sug.apps@gmail.com
        </a>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `src/components/Footer.tsx` を作成する**

```tsx
export default function Footer() {
  return (
    <footer>
      <div className="footer">
        <p>© 2026 Pochive</p>
        <nav className="footer-links">
          <a href="/pochive-site/privacy-policy">プライバシーポリシー</a>
          <a href="/pochive-site/terms">利用規約</a>
        </nav>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: `src/pages/Home.tsx` を完成形に書き換える**

```tsx
import Nav from '../components/Nav'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import PricingSection from '../components/PricingSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 5: ビルド確認**

```bash
cd /Users/yuta/Documents/poker/pochive-site && npm run build
```
Expected: エラーなし

- [ ] **Step 6: コミットする**

```bash
git add src/index.css src/components/ContactSection.tsx src/components/Footer.tsx src/pages/Home.tsx && git commit -m "feat: add ContactSection, Footer, and complete Home assembly"
```
