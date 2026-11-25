import { useEffect, useState } from 'react';
import client, { errorMessage } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ManagerQueue() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlyPending, setOnlyPending] = useState(true);

  function load() {
    setLoading(true);
    client
      .get('/manager/requests', { params: { pending: onlyPending } })
      .then(res => setRequests(res.data))
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [onlyPending]);

  async function act(id, action) {
    setError('');
    const comments = window.prompt('Optional comments for the requestor:') || '';
    try {
      await client.post(`/manager/requests/${id}/${action}`, { comments });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <div className="page-hd">
        <h2>Approvals Queue</h2>
        <p>Review, approve or reject pending requests and confirm cancellations.</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="checkbox inline">
          <input type="checkbox" checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} />
          Show only requests awaiting my action
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-row"><div className="spinner" /><span>Loading queue…</span></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Requestor</th>
                <th>Items</th>
                <th>Total</th>
                <th>Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="muted small" style={{ fontWeight: 600 }}>#{r.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.requestorUsername}</div>
                    <div className="muted small">{r.designation}</div>
                    <div className="muted small">{r.department}</div>
                  </td>
                  <td>
                    <ul className="line-list">
                      {r.lines.map((l, i) => (
                        <li key={i}>
                          <span style={{ fontWeight: 500 }}>{l.itemName}</span>
                          <span className="muted"> × {l.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{Number(r.totalCost).toFixed(2)}</td>
                  <td className="muted small" style={{ whiteSpace: 'nowrap' }}>
                    {r.fromDate}<br />{r.toDate}
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.status === 'SUBMITTED' && (
                      <div className="btn-row">
                        <button className="btn btn-sm btn-success" onClick={() => act(r.id, 'approve')}>
                          Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => act(r.id, 'reject')}>
                          Reject
                        </button>
                      </div>
                    )}
                    {r.status === 'CANCEL_REQUESTED' && (
                      <button className="btn btn-sm btn-danger" onClick={() => act(r.id, 'confirm-cancel')}>
                        Confirm cancel
                      </button>
                    )}
                    {!['SUBMITTED', 'CANCEL_REQUESTED'].includes(r.status) && (
                      <span className="muted small">
                        decided by {r.approverUsername || '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <p>{onlyPending ? 'Nothing awaiting your action.' : 'No requests found.'}</p>
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
