import { useEffect, useState } from 'react';
import client, { errorMessage } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    client
      .get('/requests/my')
      .then(res => setRequests(res.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id, action) {
    setError('');
    const confirmMsg = action === 'withdraw'
      ? 'Withdraw this request? It will be removed from the approval queue.'
      : 'Request cancellation? The admin will be asked to cancel this approved request.';
    if (!window.confirm(confirmMsg)) return;
    try {
      await client.post(`/requests/${id}/${action}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <div className="page-hd">
        <h2>My Requests</h2>
        <p>Withdraw a pending request, or ask for cancellation of an approved one.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-row"><div className="spinner" /><span>Loading requests…</span></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Items</th>
                <th>Total</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="muted small" style={{ fontWeight: 600 }}>#{r.id}</td>
                  <td>
                    <ul className="line-list">
                      {r.lines.map((l, i) => (
                        <li key={i}>
                          <span style={{ fontWeight: 500 }}>{l.itemName}</span>
                          <span className="muted"> × {l.quantity}</span>
                          <span className="muted"> — ₹{Number(l.lineTotal).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{Number(r.totalCost).toFixed(2)}</td>
                  <td className="muted small">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.status === 'SUBMITTED' && (
                      <button className="btn btn-sm btn-ghost" onClick={() => act(r.id, 'withdraw')}>
                        Withdraw
                      </button>
                    )}
                    {r.status === 'APPROVED' && (
                      <button className="btn btn-sm btn-ghost" onClick={() => act(r.id, 'cancel')}>
                        Request cancellation
                      </button>
                    )}
                    {!['SUBMITTED', 'APPROVED'].includes(r.status) && (
                      <span className="muted small">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <p>You have not submitted any requests yet.</p>
                    </div>
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
