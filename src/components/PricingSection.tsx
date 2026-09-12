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
