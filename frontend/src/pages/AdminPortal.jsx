import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client, { errorMessage } from '../api/client.js';
import FieldError from '../components/FieldError.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

// ───────────────────────── Requests tab ─────────────────────────

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState({});   // { [id]: string }
  const [busy, setBusy] = useState({});         // { [id]: bool }
  const [err, setErr] = useState('');
  const [showAll, setShowAll] = useState(false);

  function load(all) {
    setLoading(true);
    client.get(`/manager/requests?pending=${!all}`)
      .then(res => { setRequests(res.data); setShowAll(all); })
      .catch(e => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(false); }, []);

  async function decide(id, action) {
    const msg = action === 'approve'
      ? 'Approve this request? Stock will be decremented.'
      : action === 'reject'
        ? 'Reject this request? This cannot be undone.'
        : 'Confirm cancellation? Stock will be restored.';
    if (!window.confirm(msg)) return;
    setBusy(b => ({ ...b, [id]: true }));
    setErr('');
    try {
      await client.post(`/manager/requests/${id}/${action}`, { comments: comment[id] || '' });
      load(showAll);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="form-section-label" style={{ marginBottom: 0 }}>
          {showAll ? 'All requests' : 'Pending requests'}
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => load(!showAll)}>
          {showAll ? 'Show pending only' : 'Show all'}
        </button>
      </div>

      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div className="loading-row"><div className="spinner" /> Loading…</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">No requests found.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Requestor</th>
                <th>Department</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Submitted</th>
                <th style={{ minWidth: 220 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td><strong>{r.requestorUsername}</strong><br /><span className="muted small">{r.requestorEmail}</span></td>
                  <td>{r.department}</td>
                  <td>
                    {r.lines.map((l, i) => (
                      <div key={i} className="muted small">{l.itemName} × {l.quantity}</div>
                    ))}
                  </td>
                  <td>₹{Number(r.totalCost).toFixed(2)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="muted small">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'SUBMITTED' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input
                          className="input-sm"
                          placeholder="Comment (optional)"
                          value={comment[r.id] || ''}
                          onChange={e => setComment(c => ({ ...c, [r.id]: e.target.value }))}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--success)', color: '#fff' }}
                            disabled={busy[r.id]}
                            onClick={() => decide(r.id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--danger)', color: '#fff' }}
                            disabled={busy[r.id]}
                            onClick={() => decide(r.id, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                    {r.status === 'CANCEL_REQUESTED' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input
                          className="input-sm"
                          placeholder="Comment (optional)"
                          value={comment[r.id] || ''}
                          onChange={e => setComment(c => ({ ...c, [r.id]: e.target.value }))}
                        />
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--danger)', color: '#fff' }}
                          disabled={busy[r.id]}
                          onClick={() => decide(r.id, 'confirm-cancel')}
                        >
                          Confirm cancel
                        </button>
                      </div>
                    )}
                    {r.approverUsername && (
                      <div className="muted small" style={{ marginTop: 2 }}>
                        by {r.approverUsername}
                        {r.comments && <> · "{r.comments}"</>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Items tab ─────────────────────────

const EMPTY_FORM = { name: '', description: '', quantity: 0, unitCost: '', categoryId: '', adminOnly: false };

function ItemsTab() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);    // null = creating
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  function loadItems() {
    setLoading(true);
    client.get('/manager/items')
      .then(res => setItems(res.data))
      .catch(e => setServerErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadItems();
    client.get('/meta').then(res => setCategories(res.data.categories));
  }, []);

  function openAdd() {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' });
    setEditId(null);
    setErrors({});
    setServerErr('');
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      name: item.name,
      description: item.description || '',
      quantity: item.availableQuantity,
      unitCost: item.unitCost,
      categoryId: categories.find(c => c.label === item.category)?.id ?? categories[0]?.id ?? '',
      adminOnly: item.minRole === 'MANAGER',
    });
    setEditId(item.id);
    setErrors({});
    setServerErr('');
    setShowForm(true);
  }

  function validateForm() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.unitCost || Number(form.unitCost) <= 0) e.unitCost = 'Unit cost must be greater than 0.';
    if (!form.categoryId) e.categoryId = 'Category is required.';
    if (Number(form.quantity) < 0) e.quantity = 'Quantity cannot be negative.';
    return e;
  }

  async function saveItem(e) {
    e.preventDefault();
    setServerErr('');
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }
    setErrors({});
    const confirmMsg = editId
      ? `Update "${form.name.trim()}"? The changes will be saved immediately.`
      : `Add "${form.name.trim()}" to the stationery catalog?`;
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
        categoryId: Number(form.categoryId),
        adminOnly: form.adminOnly,
      };
      if (editId) {
        await client.put(`/manager/items/${editId}`, payload);
      } else {
        await client.post('/manager/items', payload);
      }
      setShowForm(false);
      loadItems();
    } catch (err) {
      setServerErr(errorMessage(err, 'Could not save item'));
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await client.delete(`/manager/items/${id}`);
      loadItems();
    } catch (err) {
      setServerErr(errorMessage(err, 'Could not delete item'));
    }
  }

  function upd(field) {
    return e => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm(f => ({ ...f, [field]: val }));
      if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="form-section-label" style={{ marginBottom: 0 }}>Stationery items</div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add item</button>
      </div>

      {serverErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{serverErr}</div>}

      {showForm && (
        <div className="admin-item-form card form" style={{ marginBottom: 20 }}>
          <div className="form-section-label">{editId ? 'Edit item' : 'New item'}</div>
          <form onSubmit={saveItem} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
              <label>
                Name
                <input value={form.name} onChange={upd('name')} placeholder="Item name" />
                <FieldError msg={errors.name} />
              </label>
              <label>
                Category
                <select value={form.categoryId} onChange={upd('categoryId')}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <FieldError msg={errors.categoryId} />
              </label>
              <label>
                Description
                <input value={form.description} onChange={upd('description')} placeholder="Short description" />
              </label>
              <label>
                Unit cost (₹)
                <input type="number" min="0.01" step="0.01" value={form.unitCost} onChange={upd('unitCost')} placeholder="e.g. 250.00" />
                <FieldError msg={errors.unitCost} />
              </label>
              <label>
                Stock quantity
                <input type="number" min="0" value={form.quantity} onChange={upd('quantity')} />
                <FieldError msg={errors.quantity} />
              </label>
              <label className="checkbox" style={{ alignSelf: 'flex-end', paddingBottom: 8 }}>
                <input type="checkbox" checked={form.adminOnly} onChange={upd('adminOnly')} />
                Admin-only item
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? 'Saving…' : editId ? 'Update item' : 'Add item'}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-row"><div className="spinner" /> Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No items yet. Add one above.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Stock</th>
                <th>Unit cost</th>
                <th>Access</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="chip" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{item.category}</span></td>
                  <td className="muted small">{item.description}</td>
                  <td>
                    <span className={`badge ${item.availableQuantity > 0 ? 'badge-ok' : 'badge-no'}`}>
                      {item.availableQuantity}
                    </span>
                  </td>
                  <td>₹{Number(item.unitCost).toFixed(2)}</td>
                  <td>
                    <span className="chip" style={item.minRole === 'MANAGER'
                      ? { background: '#ede9fe', color: '#7c3aed' }
                      : { background: '#d1fae5', color: '#059669' }}>
                      {item.minRole === 'MANAGER' ? 'Admin only' : 'All users'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => openEdit(item)}>Edit</button>
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => deleteItem(item.id, item.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Users tab ─────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [err, setErr] = useState('');

  function load() {
    setLoading(true);
    client.get('/manager/users')
      .then(res => setUsers(res.data))
      .catch(e => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function changeRole(id, currentRole) {
    const newRole = currentRole === 'MANAGER' ? 'USER' : 'MANAGER';
    const msg = newRole === 'MANAGER'
      ? 'Promote this user to Admin? They will be able to approve requests and manage stationery.'
      : 'Demote this admin to regular User? They will lose all admin privileges.';
    if (!window.confirm(msg)) return;
    setBusy(b => ({ ...b, [id]: true }));
    setErr('');
    try {
      await client.put(`/manager/users/${id}/role`, { role: newRole });
      load();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  }

  async function resetSpend(id, username) {
    if (!window.confirm(`Reset ${username}'s spend back to ₹0? Their full ₹5,000 eligibility will be restored.`)) return;
    setBusy(b => ({ ...b, [`reset_${id}`]: true }));
    setErr('');
    try {
      await client.post(`/manager/users/${id}/reset-spend`);
      load();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(b => ({ ...b, [`reset_${id}`]: false }));
    }
  }

  return (
    <div>
      <div className="form-section-label" style={{ marginBottom: 16 }}>All users</div>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}>{err}</div>}
      {loading ? (
        <div className="loading-row"><div className="spinner" /> Loading…</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong></td>
                  <td className="muted small">{u.email}</td>
                  <td>{u.department}</td>
                  <td>
                    <span className="chip" style={u.role === 'MANAGER'
                      ? { background: '#ede9fe', color: '#7c3aed' }
                      : { background: '#dbeafe', color: '#1d4ed8' }}>
                      {u.role === 'MANAGER' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-sm btn-ghost"
                      disabled={busy[u.id]}
                      onClick={() => changeRole(u.id, u.role)}
                    >
                      {u.role === 'MANAGER' ? 'Demote to User' : 'Promote to Admin'}
                    </button>
                    {u.role === 'USER' && (
                      <button
                        className="btn btn-sm btn-ghost"
                        disabled={busy[`reset_${u.id}`]}
                        onClick={() => resetSpend(u.id, u.username)}
                        style={{ color: '#d97706', borderColor: '#fbbf24' }}
                      >
                        Reset Spend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5}><div className="empty-state">No users found.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Reports tab ─────────────────────────

function ReportsTab() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    client.get('/manager/report')
      .then(res => setReport(res.data))
      .catch(e => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-row"><div className="spinner" /> Loading…</div>;
  if (err) return <div className="alert alert-error">{err}</div>;
  if (!report) return null;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="muted small">Total Spend</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>₹{Number(report.cumulativeCost).toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="muted small">Unique Items Ordered</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{report.lines.length}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="muted small">Staff Who Ordered</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{report.totalHeadCount}</div>
        </div>
      </div>
      {report.lines.length === 0 ? (
        <div className="empty-state">No approved requests yet — nothing to report.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Item</th><th>Qty Issued</th><th>Recipients</th><th>Cost</th><th>% of Total</th></tr>
            </thead>
            <tbody>
              {report.lines.map(l => (
                <tr key={l.itemId}>
                  <td><strong>{l.itemName}</strong></td>
                  <td>{l.totalQuantity}</td>
                  <td>{l.headCount}</td>
                  <td>₹{Number(l.costIncurred).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${l.percentOfTotal}%`, background: 'var(--primary)', borderRadius: 4, height: 6 }} />
                      </div>
                      <span className="muted small">{l.percentOfTotal}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Categories tab ─────────────────────────

const EMPTY_CAT = { name: '', description: '' };

function CategoriesTab() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_CAT);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    client.get('/manager/categories').then(res => setCats(res.data)).catch(e => setErr(errorMessage(e))).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function upd(f) { return e => { setForm(p => ({ ...p, [f]: e.target.value })); if (errors[f]) setErrors(p => { const n = { ...p }; delete n[f]; return n; }); }; }

  async function save(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!window.confirm(editId ? `Update category "${form.name}"?` : `Add category "${form.name}"?`)) return;
    setBusy(true); setErr('');
    try {
      if (editId) await client.put(`/manager/categories/${editId}`, form);
      else await client.post('/manager/categories', form);
      setShowForm(false); load();
    } catch (e2) { setErr(errorMessage(e2)); } finally { setBusy(false); }
  }

  async function del(id, name) {
    if (!window.confirm(`Delete category "${name}"? Items using it will be affected.`)) return;
    try { await client.delete(`/manager/categories/${id}`); load(); } catch (e2) { setErr(errorMessage(e2)); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="form-section-label" style={{ marginBottom: 0 }}>Item categories</div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY_CAT); setEditId(null); setErrors({}); setErr(''); setShowForm(true); }}>+ Add category</button>
      </div>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}>{err}</div>}
      {showForm && (
        <div className="card form" style={{ marginBottom: 20 }}>
          <div className="form-section-label">{editId ? 'Edit category' : 'New category'}</div>
          <form onSubmit={save} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
              <label>Name<input value={form.name} onChange={upd('name')} placeholder="e.g. Paper" /><FieldError msg={errors.name} /></label>
              <label>Description<input value={form.description} onChange={upd('description')} placeholder="Short description" /></label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : editId ? 'Update' : 'Add'}</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <div className="loading-row"><div className="spinner" /> Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td className="muted small">{c.description}</td>
                  <td><div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setForm({ name: c.name, description: c.description }); setEditId(c.id); setErrors({}); setErr(''); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => del(c.id, c.name)}>Delete</button>
                  </div></td>
                </tr>
              ))}
              {cats.length === 0 && <tr><td colSpan={3}><div className="empty-state">No categories yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Departments tab ─────────────────────────

const EMPTY_DEPT = { name: '', code: '' };

function DepartmentsTab() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_DEPT);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    client.get('/manager/departments').then(res => setDepts(res.data)).catch(e => setErr(errorMessage(e))).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function upd(f) { return e => { setForm(p => ({ ...p, [f]: e.target.value })); if (errors[f]) setErrors(p => { const n = { ...p }; delete n[f]; return n; }); }; }

  async function save(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.code.trim()) errs.code = 'Code is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!window.confirm(editId ? `Update department "${form.name}"?` : `Add department "${form.name}"?`)) return;
    setBusy(true); setErr('');
    try {
      if (editId) await client.put(`/manager/departments/${editId}`, form);
      else await client.post('/manager/departments', form);
      setShowForm(false); load();
    } catch (e2) { setErr(errorMessage(e2)); } finally { setBusy(false); }
  }

  async function del(id, name) {
    if (!window.confirm(`Delete department "${name}"? Users assigned to it will be affected.`)) return;
    try { await client.delete(`/manager/departments/${id}`); load(); } catch (e2) { setErr(errorMessage(e2)); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="form-section-label" style={{ marginBottom: 0 }}>Departments</div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY_DEPT); setEditId(null); setErrors({}); setErr(''); setShowForm(true); }}>+ Add department</button>
      </div>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}>{err}</div>}
      {showForm && (
        <div className="card form" style={{ marginBottom: 20 }}>
          <div className="form-section-label">{editId ? 'Edit department' : 'New department'}</div>
          <form onSubmit={save} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
              <label>Name<input value={form.name} onChange={upd('name')} placeholder="e.g. Computer Science" /><FieldError msg={errors.name} /></label>
              <label>Code <span className="muted small">(short abbreviation)</span><input value={form.code} onChange={upd('code')} placeholder="e.g. CSE" /><FieldError msg={errors.code} /></label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : editId ? 'Update' : 'Add'}</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <div className="loading-row"><div className="spinner" /> Loading…</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Code</th><th></th></tr></thead>
            <tbody>
              {depts.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td><span className="chip" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{d.code}</span></td>
                  <td><div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setForm({ name: d.name, code: d.code }); setEditId(d.id); setErrors({}); setErr(''); setShowForm(true); }}>Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => del(d.id, d.name)}>Delete</button>
                  </div></td>
                </tr>
              ))}
              {depts.length === 0 && <tr><td colSpan={3}><div className="empty-state">No departments yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Low Stock tab ─────────────────────────

function LowStockTab() {
  const [items, setItems] = useState([]);
  const [threshold, setThreshold] = useState(10);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    client.get('/manager/items')
      .then(res => setItems(res.data))
      .catch(e => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const low = items.filter(i => i.availableQuantity <= threshold);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="form-section-label" style={{ marginBottom: 0 }}>
          Low stock items &nbsp;<span className="badge badge-no">{low.length}</span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          Threshold
          <input type="number" min="1" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
            style={{ width: 70 }} className="input-sm" />
        </label>
      </div>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}>{err}</div>}
      {loading ? <div className="loading-row"><div className="spinner" /> Loading…</div> :
        low.length === 0 ? <div className="empty-state">All items are above the stock threshold of {threshold}.</div> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Unit Cost</th></tr></thead>
              <tbody>
                {low.sort((a, b) => a.availableQuantity - b.availableQuantity).map(i => (
                  <tr key={i.id}>
                    <td><strong>{i.name}</strong></td>
                    <td><span className="chip" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{i.category}</span></td>
                    <td><span className={`badge ${i.availableQuantity === 0 ? 'badge-no' : 'badge-pending'}`}>{i.availableQuantity}</span></td>
                    <td>₹{Number(i.unitCost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

// ───────────────────────── History tab ─────────────────────────

function HistoryTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [err, setErr] = useState('');

  useEffect(() => {
    setLoading(true);
    client.get('/manager/requests?pending=false')
      .then(res => setRequests(res.data))
      .catch(e => setErr(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const statuses = ['ALL', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN'];
  const shown = filter === 'ALL' ? requests.filter(r => r.status !== 'SUBMITTED') : requests.filter(r => r.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)}>
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {err && <div className="alert alert-error" style={{ marginBottom: 12 }}>{err}</div>}
      {loading ? <div className="loading-row"><div className="spinner" /> Loading…</div> :
        shown.length === 0 ? <div className="empty-state">No requests found.</div> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>#</th><th>Requestor</th><th>Items</th><th>Total</th><th>Status</th><th>Decided by</th><th>Date</th></tr></thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.id}>
                    <td className="muted small">#{r.id}</td>
                    <td><strong>{r.requestorUsername}</strong><br /><span className="muted small">{r.department}</span></td>
                    <td className="muted small">{r.lines.map((l, i) => <div key={i}>{l.itemName} × {l.quantity}</div>)}</td>
                    <td>₹{Number(r.totalCost).toFixed(2)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="muted small">{r.approverUsername || '—'}{r.comments && <div>"{r.comments}"</div>}</td>
                    <td className="muted small">{new Date(r.decidedAt || r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}



const TABS = [
  { key: 'requests',    label: 'Requests' },
  { key: 'items',       label: 'Stationery' },
  { key: 'users',       label: 'Users' },
  { key: 'categories',  label: 'Categories' },
  { key: 'departments', label: 'Departments' },
  { key: 'lowstock',    label: 'Low Stock' },
  { key: 'reports',     label: 'Reports' },
  { key: 'history',     label: 'History' },
];

export default function AdminPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.find(t => t.key === searchParams.get('tab'))?.key ?? 'requests';

  return (
    <div>
      <div className="page-hd">
        <h2>Admin Portal</h2>
        <p>Manage stationery requests and the product catalog.</p>
      </div>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`admin-tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setSearchParams({ tab: t.key })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === 'requests'    && <RequestsTab />}
        {tab === 'items'       && <ItemsTab />}
        {tab === 'users'       && <UsersTab />}
        {tab === 'categories'  && <CategoriesTab />}
        {tab === 'departments' && <DepartmentsTab />}
        {tab === 'lowstock'    && <LowStockTab />}
        {tab === 'reports'     && <ReportsTab />}
        {tab === 'history'     && <HistoryTab />}
      </div>
    </div>
  );
}
