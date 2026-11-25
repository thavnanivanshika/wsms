import { useEffect, useState } from 'react';
import client, { errorMessage } from '../api/client.js';

const CATEGORY_COLORS = {
  default: { bg: 'var(--primary-subtle)', color: 'var(--primary)' },
};

function catChip(name) {
  const palette = [
    { bg: '#eef2ff', color: '#4f46e5' },
    { bg: '#d1fae5', color: '#059669' },
    { bg: '#fef3c7', color: '#d97706' },
    { bg: '#ffe4e6', color: '#e11d48' },
    { bg: '#cffafe', color: '#0891b2' },
    { bg: '#ede9fe', color: '#7c3aed' },
  ];
  const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

export default function Items() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/items')
      .then(res => setItems(res.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-hd">
        <h2>Stationery Availability</h2>
        <p>Items you are eligible to request, filtered by your role. Stock is live.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-row"><div className="spinner" /><span>Loading items…</span></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Description</th>
                <th>In stock</th>
                <th>Unit cost</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => {
                const c = catChip(i.category);
                return (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.name}</td>
                    <td>
                      <span className="chip" style={{ background: c.bg, color: c.color }}>
                        {i.category || '—'}
                      </span>
                    </td>
                    <td className="muted small">{i.description || '—'}</td>
                    <td>
                      <span className={`badge ${i.availableQuantity > 0 ? 'badge-ok' : 'badge-no'}`}>
                        {i.availableQuantity > 0 ? `${i.availableQuantity} units` : 'Out of stock'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{Number(i.unitCost).toFixed(2)}</td>
                    <td>
                      {i.minRole === 'MANAGER'
                        ? <span className="chip" style={{ background: '#ede9fe', color: '#7c3aed' }}>Managers</span>
                        : <span className="chip" style={{ background: '#d1fae5', color: '#059669' }}>All staff</span>}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state"><p>No items available for your role.</p></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
