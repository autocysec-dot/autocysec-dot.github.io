import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const TYPES = ['library', 'framework', 'application', 'operating-system', 'firmware', 'device', 'file'];
const blank = { name: '', version: '', type: 'library', supplier: '', license: '', purl: '' };

export default function Sbom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.getAssessment(id)
      .then((d) => {
        setAssessment(d.assessment);
        setRows(d.assessment.sbom?.components?.length ? d.assessment.sbom.components : [{ ...blank }]);
        setSummary(d.assessment.sbom?.summary || null);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="container"><div className="error">{error}</div></div>;
  if (!assessment) return <div className="center spinner">Loading…</div>;

  const setCell = (i, k) => (e) => {
    const next = rows.slice();
    next[i] = { ...next[i], [k]: e.target.value };
    setRows(next);
  };
  const addRow = () => setRows([...rows, { ...blank }]);
  const removeRow = (i) => setRows(rows.filter((_, x) => x !== i));

  async function save() {
    setError(''); setSaved('');
    try {
      const { sbom } = await api.saveSbom(id, rows);
      setSummary(sbom.summary);
      setRows(sbom.components.length ? sbom.components : [{ ...blank }]);
      setSaved(`Saved — ${sbom.summary.count} component(s).`);
    } catch (e) { setError(e.message); }
  }

  async function exportJson() {
    await save();
    const doc = await api.exportSbom(id);
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${assessment.productName.replace(/\s+/g, '_')}_sbom_cyclonedx.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container wide">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ flex: 1 }}>SBOM — {assessment.productName}</h1>
        <button className="btn secondary" onClick={() => navigate(`/assessments/${id}`)}>Back</button>
      </div>
      <p className="muted">
        Software Bill of Materials. The CRA (Annex I, Part II) requires at least your top-level
        dependencies in a machine-readable format. Export as CycloneDX 1.5.
      </p>

      {summary && (
        <div className="card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div><div className="muted small">Components</div><div style={{ fontSize: 26, fontWeight: 800 }}>{summary.count}</div></div>
          <div className="muted small">
            {summary.suppliers} supplier(s) · {summary.licenses.length} licence(s)
            {summary.missingVersion > 0 && <span style={{ color: 'var(--amber)' }}> · {summary.missingVersion} missing version</span>}
            {summary.missingLicense > 0 && <span style={{ color: 'var(--amber)' }}> · {summary.missingLicense} missing licence</span>}
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: 6 }}>Name *</th><th style={{ padding: 6 }}>Version</th><th style={{ padding: 6 }}>Type</th>
              <th style={{ padding: 6 }}>Supplier</th><th style={{ padding: 6 }}>Licence</th><th style={{ padding: 6 }}>PURL</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: 4 }}><input value={r.name} onChange={setCell(i, 'name')} style={cell} /></td>
                <td style={{ padding: 4 }}><input value={r.version} onChange={setCell(i, 'version')} style={cell} /></td>
                <td style={{ padding: 4 }}>
                  <select value={r.type} onChange={setCell(i, 'type')} className="cps-select" style={{ padding: 6 }}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{ padding: 4 }}><input value={r.supplier} onChange={setCell(i, 'supplier')} style={cell} /></td>
                <td style={{ padding: 4 }}><input value={r.license} onChange={setCell(i, 'license')} style={cell} /></td>
                <td style={{ padding: 4 }}><input value={r.purl} onChange={setCell(i, 'purl')} style={cell} /></td>
                <td style={{ padding: 4 }}><button className="btn danger" style={{ padding: '4px 8px' }} onClick={() => removeRow(i)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="btn-row">
          <button className="btn secondary" onClick={addRow}>+ Add component</button>
          <button className="btn" onClick={save}>Save SBOM</button>
          <button className="btn secondary" onClick={exportJson}>Export CycloneDX</button>
        </div>
        {saved && <div className="success">{saved}</div>}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

const cell = { width: '100%', padding: '6px 8px', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13 };
