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
