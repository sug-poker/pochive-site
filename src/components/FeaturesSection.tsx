const FEATURES = [
  {
    title: 'セッション記録',
    desc: '現金ゲーム・トーナメントのセッションを無制限に記録・管理。入退店時刻・損益を追跡。',
    img: '/screenshots/records.png',
  },
  {
    title: 'ハンド記録',
    desc: 'プレイしたハンドをホールカード・ボード・アクションまで詳細に記録。タグやレビューポイントで後から振り返りやすく。',
    img: '/screenshots/hands.png',
  },
  {
    title: 'バンクロール・統計',
    desc: '現在残高・推奨 Buy-in・ストップロスを自動計算し、入出金履歴で資金を管理。残高推移グラフ・ドローダウン・ROI・勝率・時給などの詳細統計で実力を数値化（Analyzer プラン）。',
    img: '/screenshots/bankroll.png',
  },
  {
    title: '遠征管理',
    desc: '海外・国内遠征ごとにセッションをまとめて管理。航空券・ホテル・食事などの経費も含めた遠征収支や勝率・時給を一目で把握。',
    img: '/screenshots/trip.png',
  },
] as const

export default function FeaturesSection() {
  return (
    <section id="features" className="features">
      <div className="section-inner">
        <h2 className="section-title">機能</h2>
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`feature-row${i % 2 === 1 ? ' feature-row--reverse' : ''}`}
          >
            <div className="feature-row-phone">
              <div className="iphone-frame-md">
                <img src={f.img} alt={f.title} className="iphone-screen-md" />
              </div>
            </div>
            <div className="feature-row-body">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
