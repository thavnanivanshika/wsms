import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client, { errorMessage } from '../api/client.js';
import FieldError from '../components/FieldError.jsx';

export default function NewRequest() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [error, setError] = useState('');
  const [lineErrors, setLineErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/items').then(res => {
      setItems(res.data);
      if (res.data.length) setLines([{ itemId: String(res.data[0].id), quantity: 1 }]);
    });
  }, []);

  function itemById(id) {
    return items.find(i => String(i.id) === String(id));
  }

  function lineTotal(line) {
    const it = itemById(line.itemId);
    return it ? Number(it.unitCost) * Number(line.quantity || 0) : 0;
  }

  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  function updateLine(idx, field, value) {
    setLines(ls => ls.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    if (lineErrors[idx]) setLineErrors(prev => { const n = { ...prev }; delete n[idx]; return n; });
  }

  function addLine() {
    setLines(ls => [...ls, { itemId: String(items[0]?.id ?? ''), quantity: 1 }]);
  }

  function removeLine(idx) {
    setLines(ls => ls.filter((_, i) => i !== idx));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLineErrors({});
    setSuccess('');
    if (!lines.length) { setError('Add at least one item.'); return; }

    // Per-line validation
    const le = {};
    const seenItems = new Set();
    lines.forEach((l, idx) => {
      const qty = Number(l.quantity);
      if (qty < 1) le[idx] = 'Quantity must be at least 1.';
      else if (qty > 100) le[idx] = 'Quantity must not exceed 100.';
      else if (seenItems.has(l.itemId)) le[idx] = 'This item is already in another line. Combine them or remove the duplicate.';
      seenItems.add(l.itemId);
    });
    if (Object.keys(le).length > 0) { setLineErrors(le); return; }
    if (lines.length > 10) { setError('A request may contain at most 10 item lines.'); return; }

    setBusy(true);
    try {
      await client.post('/requests', {
        lines: lines.map(l => ({ itemId: Number(l.itemId), quantity: Number(l.quantity) })),
      });
      setSuccess('Request submitted! Redirecting…');
      setTimeout(() => navigate('/my-requests'), 900);
    } catch (err) {
      setError(errorMessage(err, 'Could not submit request'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-hd">
        <h2>New Stationery Request</h2>
        <p>Select the items you need and submit for admin approval.</p>
      </div>

      {error   && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-ok"    style={{ marginBottom: 16 }}>{success}</div>}

      <form onSubmit={submit} style={{ maxWidth: 740 }}>
        <div className="line-builder">
          <div className="line-builder-hd">
            <span>Items</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={addLine}>
              + Add item
            </button>
          </div>

          {lines.map((l, idx) => (
            <div className="line-row" key={idx}>
              <select value={l.itemId} onChange={e => updateLine(idx, 'itemId', e.target.value)}>
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} — ₹{Number(i.unitCost).toFixed(2)} ({i.availableQuantity} in stock)
                  </option>
                ))}
              </select>
              <input
                type="number" min={1} max={100}
                value={l.quantity}
                onChange={e => updateLine(idx, 'quantity', e.target.value)}
              />
              <div className="line-total">₹{lineTotal(l).toFixed(2)}</div>
              <div>
                {lines.length > 1 && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeLine(idx)}>
                    ✕
                  </button>
                )}
              </div>
              {lineErrors[idx] && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldError msg={lineErrors[idx]} />
                </div>
              )}
            </div>
          ))}

          <div className="grand-total-row">
            <span>Grand total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <button className="btn btn-primary" disabled={busy || !lines.length} style={{ marginTop: 16 }}>
          {busy ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
    </div>
  );
}
