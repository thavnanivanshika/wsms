import { useEffect, useState } from 'react';
import client, { errorMessage } from '../api/client.js';

export default function Report() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/manager/report')
      .then(res => setReport(res.data))
      .catch(err => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!report) return <div className="loading-row"><div className="spinner" /><span>Loading report…</span></div>;

  const maxCost = report.lines.length
    ? Math.max(...report.lines.map(l => Number(l.costIncurred)))
    : 1;

  return (
    <div>
      <div className="page-hd">
        <h2>Stationery Cost Report</h2>
        <p>Aggregated over approved requests — cost incurred per item, head count and share of total.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card sc--violet">
          <div className="sc-icon">💰</div>
          <div className="sc-label">Cumulative cost</div>
          <div className="sc-value accent">₹{Number(report.cumulativeCost).toFixed(2)}</div>
        </div>
        <div className="stat-card sc--teal">
          <div className="sc-icon">👥</div>
          <div className="sc-label">Total requestors</div>
          <div className="sc-value">{report.totalHeadCount}</div>
        </div>
        <div className="stat-card sc--blue">
          <div className="sc-icon">📦</div>
          <div className="sc-label">Item types</div>
          <div className="sc-value">{report.lines.length}</div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty approved</th>
              <th>Head count</th>
              <th>Cost incurred</th>
              <th style={{ minWidth: 180 }}>% of total</th>
            </tr>
          </thead>
          <tbody>
            {report.lines.map(l => {
              const barPct = maxCost > 0 ? (Number(l.costIncurred) / maxCost) * 100 : 0;
              return (
                <tr key={l.itemId}>
                  <td style={{ fontWeight: 600 }}>{l.itemName}</td>
                  <td>{l.totalQuantity}</td>
                  <td>{l.headCount}</td>
                  <td style={{ fontWeight: 700 }}>₹{Number(l.costIncurred).toFixed(2)}</td>
                  <td>
                    <div className="bar-wrap">
                      <div className="bar" style={{ width: `${Math.min(barPct, 100)}px` }} />
                      <span>{Number(l.percentOfTotal).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {report.lines.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state"><p>No approved requests yet.</p></div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
