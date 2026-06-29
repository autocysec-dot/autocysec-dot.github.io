import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const TIER_LABEL = {
  default: 'Default', 'important-class-i': 'Important I', 'important-class-ii': 'Important II', critical: 'Critical',
};
const STATE_COLOR = { overdue: 'var(--red)', 'due-soon': 'var(--amber)', pending: 'var(--muted)', submitted: 'var(--green)' };

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="container"><div className="error">{error}</div></div>;
  if (!data) return <div className="center spinner">Loading…</div>;

  const { summary, reporting, products, keyDates } = data;
  const readinessColor = summary.avgReadiness == null ? 'var(--muted)'
    : summary.avgReadiness >= 80 ? 'var(--green)' : summary.avgReadiness >= 50 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="container wide">
      <h1>Compliance overview</h1>
      <p className="muted">Your CRA posture across all products, with open reporting deadlines.</p>

      {/* top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 8 }}>
        <Stat label="Products" value={summary.totalProducts} sub={`${summary.inScopeCount} in scope · ${summary.outOfScopeCount} out`} />
        <Stat label="Avg Annex I readiness" value={summary.avgReadiness == null ? '—' : `${summary.avgReadiness}%`} color={readinessColor} />
        <Stat label="Reporting overdue" value={reporting.overdue} color={reporting.overdue ? 'var(--red)' : 'var(--green)'} sub={`${reporting.dueSoon} due soon`} />
        <Stat label="Open vulns / incidents" value={`${reporting.openVulnerabilities} / ${reporting.openIncidents}`} />
      </div>

      {/* scope mix + docs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <div className="card">
          <h2>Risk classes (in scope)</h2>
          {Object.keys(summary.byTier).length === 0 && <p className="muted">No in-scope products yet.</p>}
          {Object.entries(summary.byTier).map(([tier, n]) => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className={`badge ${tier}`}>{TIER_LABEL[tier] || tier}</span>
              <span className="muted small">{n} product{n > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h2>Documentation</h2>
          <DocBar label="Self-assessments" done={summary.docs.selfAssessments} total={summary.docs.total} />
          <DocBar label="Declarations of Conformity" done={summary.docs.declarations} total={summary.docs.total} />
          <DocBar label="Technical documentation" done={summary.docs.techdocs} total={summary.docs.total} />
        </div>
      </div>

      {/* reporting attention */}
      <div className="card">
        <h2>Reporting needing attention</h2>
        {reporting.attention.length === 0 && <p className="muted">Nothing outstanding. 🎉</p>}
        {reporting.attention.map((a) => (
          <div key={a.id} className="list-item">
            <div className="grow">
              <strong>{a.title}</strong> <span className="muted small">({a.kind}{a.product ? ` · ${a.product}` : ''})</span>
              <div className="small" style={{ color: STATE_COLOR[a.nextState] }}>
                {a.nextStage}: {a.remainingText}{a.nextDueIso ? ` · due ${new Date(a.nextDueIso).toLocaleString()}` : ''}
              </div>
            </div>
            <Link className="btn secondary" to="/register">Open register</Link>
          </div>
        ))}
      </div>

      {/* products table */}
      <div className="card">
        <h2>Products</h2>
        {products.length === 0 && <p className="muted">No products yet. <Link to="/">Run the classifier</Link>.</p>}
        {products.map((p) => (
          <div key={p.id} className="list-item">
            <div className="grow">
              <Link to={`/assessments/${p.id}`} style={{ fontWeight: 600 }}>{p.productName}</Link>
              <div className="muted small">
                {p.inScope ? (p.tierLabel || 'In scope') : 'Out of scope'}
                {p.readiness != null && ` · readiness ${p.readiness}%`}
              </div>
            </div>
            <DocDots p={p} />
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Key CRA dates</h2>
        <div className="dates">
          <div className="date-pill"><strong>Entered into force</strong>{keyDates.entryIntoForce}</div>
          <div className="date-pill"><strong>Reporting obligations</strong>{keyDates.reportingObligationsApply}</div>
          <div className="date-pill"><strong>Main obligations</strong>{keyDates.mainObligationsApply}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="card" style={{ margin: 0 }}>
      <div className="muted small">{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function DocBar({ label, done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="small" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span><span className="muted">{done}/{total}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginTop: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
      </div>
    </div>
  );
}

function DocDots({ p }) {
  const dot = (ok, title) => (
    <span title={title} style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: ok ? 'var(--green)' : 'var(--border)' }} />
  );
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {dot(p.hasSelfAssessment, 'Self-assessment')}
      {dot(p.hasDeclaration, 'Declaration')}
      {dot(p.hasTechdoc, 'Technical documentation')}
    </div>
  );
}
