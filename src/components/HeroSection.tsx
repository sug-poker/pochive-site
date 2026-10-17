// 6-max seats in the shader's table plane (see src/shaders/hero.glsl seatT), BTN first.
const SEATS = [
  { name: 'BTN', x: 0, y: -0.43 },
  { name: 'SB', x: 0.43, y: -0.33 },
  { name: 'BB', x: 0.43, y: 0.33 },
  { name: 'UTG', x: 0, y: 0.43 },
  { name: 'HJ', x: -0.43, y: 0.33 },
  { name: 'CO', x: -0.43, y: -0.33 },
] as const

// Label position as a percentage of the hero-table anchor (2.3:1, unit = its height):
// labels sit 1.2x out from the seat, the table is tilted by .42, and the anchor spans .46 shader units.
const seatStyle = (x: number, y: number) => ({
  left: `${50 + ((x * 1.2) / 0.46 / 2.3) * 100}%`,
  top: `${50 - ((y * 1.2 * 0.42) / 0.46) * 100}%`,
})

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
        <div className="hero-table" data-shader-anchor="hero-table" aria-hidden="true">
          {SEATS.map((s, i) => (
            <span key={s.name} className={`hero-seat${i === 0 ? ' hero-seat--me' : ''}`} style={seatStyle(s.x, s.y)}>
              {s.name}
            </span>
          ))}
        </div>
        <div className="iphone-frame hero-phone" data-shader-anchor="hero-phone" data-screen="hands">
          <img src="/screenshots/hands.png" alt="Pochive ハンド記録画面" className="iphone-screen hero-shot hero-shot--hands" />
          <img src="/screenshots/bankroll.png" alt="Pochive バンクロール・統計画面" className="iphone-screen hero-shot hero-shot--bankroll" />
        </div>
      </div>
    </section>
  )
}
