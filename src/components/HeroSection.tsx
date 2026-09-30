export default function HeroSection() {
  return (
    <section id="hero">
      <div className="hero">
        <div className="hero-content">
          <span className="badge">App Store で配信中</span>
          <h1 className="hero-logo">
            Pochive
            <span className="hero-logo-sub">ポーカー収支管理・ハンド記録アプリ</span>
          </h1>
          <p className="hero-tagline">ポーカーを、記録する。</p>
          <p className="hero-desc">
            セッション・ハンド・バンクロールを一元管理。<br />
            あなたのポーカーをデータで支える iOS アプリ。
          </p>
          <a href="https://apps.apple.com/jp/app/pochive/id6809109645" className="btn-appstore">
            App Store でダウンロード
          </a>
        </div>
        <div className="iphone-frame">
          <img src="/screenshots/home.png" alt="Pochive ホーム画面" className="iphone-screen" />
        </div>
      </div>
    </section>
  )
}
