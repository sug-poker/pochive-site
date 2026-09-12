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
