# Pochive サイト設計書

## 概要

pochive（iOS ポーカーセッション・ハンド記録アプリ）のアプリ紹介用 Web サイト。App Store 公開に向けて、ユーザー獲得を目的としたランディングページを構築する。

- **公開方法**: GitHub Pages (`/pochive-site/` サブディレクトリ)
- **技術スタック**: React 19 + react-router-dom v7 + TypeScript + Vite
- **アプローチ**: フル SPA（1 ページ構成）

## ページ構成

### ルーティング

| パス | 内容 |
|---|---|
| `/pochive-site/` | メインランディングページ（Home.tsx） |
| `/pochive-site/privacy-policy` | 既存 `privacy-policy.html`（React なし） |
| `/pochive-site/terms` | 既存 `terms.html`（React なし） |

プライバシーポリシー・利用規約は既存の standalone HTML をそのまま流用する。Reactコンポーネント化は行わない。

### セクション構成（Home.tsx 内）

1. **Nav** — ヘッダーナビゲーション
2. **HeroSection** — `#hero`
3. **FeaturesSection** — `#features`
4. **PricingSection** — `#pricing`
5. **ContactSection** — `#contact`
6. **Footer**

セクション間の遷移はアンカーリンク（`#features` 等）によるスクロール。

## ファイル構成

```
src/
├── main.tsx                  # 既存（変更なし）
├── App.tsx                   # React Router 定義（既存を書き換え）
├── index.css                 # グローバルスタイル（既存を拡張）
├── App.css                   # 削除（index.css に統合）
├── pages/
│   └── Home.tsx              # 1 ページのメインコンテンツ
└── components/
    ├── Nav.tsx
    ├── HeroSection.tsx
    ├── FeaturesSection.tsx
    ├── PricingSection.tsx
    ├── ContactSection.tsx
    └── Footer.tsx
```

## ビジュアルデザイン

### カラーパレット（既存継承）

| CSS 変数 | 値 | 用途 |
|---|---|---|
| `--bg` | `#0a0f0d` | ページ背景 |
| `--surface` | `#111a14` | カード・セクション背景 |
| `--text` | `#f0e6c8` | 本文テキスト |
| `--gold` | `#c9a84c` | アクセント・見出し・CTA |
| `--muted` | `#8a9b8e` | 補足テキスト |
| `--border` | `#1c2b22` | ボーダー・区切り |

### レイアウト

- モバイルファースト
- コンテンツ最大幅: `1100px`（`margin: 0 auto`）
- セクション間の区切りはライン不使用、余白のみ
- フォント: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`（既存継承）

### スクリーンショット

現時点では実機スクリーンショットなし。iPhone フレーム風のプレースホルダー要素（CSS のみ）を使用し、後から実画像に差し替え可能な構造にする。

## 各コンポーネント仕様

### Nav

- ロゴ（左）+ ナビリンク（右）: `機能` `料金` `お問い合わせ`
- リンクはアンカー（`href="#features"` 等）
- スクロール量 > 50px でナビ背景を半透明（`#0a0f0dcc` + backdrop-filter）に切り替え

### HeroSection

- バッジ: 「App Store 近日公開」
- ロゴ: 「Pochive」（大）
- キャッチコピー: 「ポーカーを、記録する。」
- サブテキスト: アプリの簡単な説明
- App Store ボタン: リンク先は `#`（公開後に差し替え）
- iPhone モックアップ: プレースホルダー

### FeaturesSection

機能カードを 2×2 グリッド（モバイルは 1 列）で表示。

| カード | タイトル | 説明 |
|---|---|---|
| 1 | セッション記録 | 現金ゲーム・トーナメントのセッションを記録・管理 |
| 2 | ハンド記録 | プレイしたハンドを詳細に記録 |
| 3 | バンクロール管理 | 資金管理・推奨 Buy-in・入出金履歴 |
| 4 | 統計・分析 | P&L グラフ・RISK 分析・詳細統計（Analyzer プラン） |

各カードに iPhone プレースホルダー画像を配置。

### PricingSection

`@pochive/plans` パッケージの `COMPARISON_FEATURES` と `PLANS` を使用。

- Free と Analyzer を横並び（モバイルは縦積み）で比較
- Analyzer カードをゴールドのボーダーでハイライト
- 比較表: `COMPARISON_FEATURES` の全項目を `boolean | string` で表示（✓ / — / テキスト）
- Analyzer カードに「おすすめ」バッジ

### ContactSection

- 見出し: 「サポート・お問い合わせ」
- メールアドレス: `sug.apps@gmail.com`（`mailto:` リンク）
- シンプルなテキストのみ、フォームなし

### Footer

- コピーライト: `© 2026 Pochive`
- リンク: プライバシーポリシー（`/pochive-site/privacy-policy`）・利用規約（`/pochive-site/terms`）

## 実装上の注意点

- `vite.config.ts` の `base: '/pochive-site/'` は変更しない
- `public/` 内の既存ファイル（`privacy-policy.html`, `terms.html`, `404.html`, `favicon.svg`）は変更しない
- App Store URL が確定したら `HeroSection.tsx` の `href="#"` を差し替えるだけでよい構造にする
- スクリーンショットが用意できたら `FeaturesSection.tsx` の `<img>` の `src` を差し替えるだけでよい構造にする
