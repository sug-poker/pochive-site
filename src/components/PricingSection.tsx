import { COMPARISON_FEATURES, PLANS, localize } from '@pochive/plans'
import type { ComparisonFeature, LocalizedText } from '@pochive/plans'

function renderValue(val: boolean | LocalizedText): string {
  if (val === true) return '✓'
  if (val === false) return '—'
  return localize(val, 'ja')
}

function PlanCard({ tier, highlight }: { tier: 'free' | 'analyzer'; highlight?: boolean }) {
  const plan = PLANS[tier]
  return (
    <div className={`pricing-card${highlight ? ' pricing-card--highlight' : ''}`}>
      <div className="pricing-card-header">
        {highlight && <span className="badge">おすすめ</span>}
        <h3>{localize(plan.name, 'ja')}</h3>
      </div>
      {plan.price ? (
        <div className="pricing-card-price">
          <span className="pricing-card-price-monthly">{plan.price.monthly}<span>/月</span></span>
          <span className="pricing-card-price-yearly">年額 {plan.price.yearly}</span>
        </div>
      ) : (
        <div className="pricing-card-price">
          <span className="pricing-card-price-monthly">無料</span>
        </div>
      )}
      <ul>
        {plan.features.map((f) => (
          <li key={f.label.ja}>{localize(f.label, 'ja')}</li>
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
          <tr key={f.label.ja}>
            <td>{localize(f.label, 'ja')}</td>
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
