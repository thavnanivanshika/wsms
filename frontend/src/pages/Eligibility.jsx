import { useEffect, useState } from 'react';
import client, { errorMessage } from '../api/client.js';

export default function Eligibility() {
  const [elig, setElig] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/eligibility')
      .then(res => setElig(res.data))
      .catch(err => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!elig) return <div className="loading-row"><div className="spinner" /><span>Loading…</span></div>;

  const pctUsed = elig.maxPurchaseValue > 0
    ? (elig.committedValue / elig.maxPurchaseValue) * 100
    : 0;

  const isWarn = pctUsed >= 80;

  return (
    <div>
      <div className="page-hd">
        <h2>My Eligibility</h2>
        <p>Your stationery budget for the current cycle.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card sc--blue">
          <div className="sc-icon">💳</div>
          <div className="sc-label">Purchase cap</div>
          <div className="sc-value">₹{Number(elig.maxPurchaseValue).toFixed(2)}</div>
        </div>
        <div className="stat-card sc--amber">
          <div className="sc-icon">📋</div>
          <div className="sc-label">Committed (active)</div>
          <div className="sc-value">₹{Number(elig.committedValue).toFixed(2)}</div>
        </div>
        <div className="stat-card sc--green">
          <div className="sc-icon">✅</div>
          <div className="sc-label">Remaining</div>
          <div className={`sc-value ${elig.remainingValue <= 0 ? 'text-danger' : 'accent'}`}>
            ₹{Number(elig.remainingValue).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="elig-meter-card">
        <div className="meter-labels">
          <span style={{ fontWeight: 600, color: 'var(--ink-2)', fontSize: 14 }}>
            Eligibility usage
          </span>
          <span style={{ fontWeight: 700, color: isWarn ? 'var(--danger)' : 'var(--ink)' }}>
            {pctUsed.toFixed(1)}%
          </span>
        </div>
        <div className="meter" style={{ height: 10, margin: '8px 0' }}>
          <div
            className={`meter-fill${isWarn ? ' meter-fill--warn' : ''}`}
            style={{ width: `${Math.min(pctUsed, 100)}%` }}
          />
        </div>
        <div className="meter-labels">
          <span>₹0</span>
          <span>₹{Number(elig.committedValue).toFixed(0)} used</span>
          <span>₹{Number(elig.maxPurchaseValue).toFixed(0)} cap</span>
        </div>
      </div>

      <div style={{
        marginTop: 16,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontSize: 13,
        color: 'var(--muted-color)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span>🔄</span>
        {elig.spendResetAt
          ? <span>Spend last reset by admin on <strong style={{ color: 'var(--ink-2)' }}>{elig.spendResetAt}</strong></span>
          : <span>Spend has not been reset yet — contact admin to reset your limit.</span>
        }
      </div>
    </div>
  );
}
