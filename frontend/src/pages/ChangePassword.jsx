import { useState } from 'react';
import client, { errorMessage } from '../api/client.js';
import FieldError from '../components/FieldError.jsx';

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return e => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };
  }

  async function submit(e) {
    e.preventDefault();
    setServerError('');
    setSuccess('');

    const e2 = {};
    if (!form.currentPassword) e2.currentPassword = 'Current password is required.';
    if (!form.newPassword) {
      e2.newPassword = 'New password is required.';
    } else if (form.newPassword.length < 8) {
      e2.newPassword = 'New password must be at least 8 characters.';
    }
    if (!form.confirm) {
      e2.confirm = 'Please confirm your new password.';
    } else if (form.newPassword !== form.confirm) {
      e2.confirm = 'Passwords do not match.';
    }
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setErrors({});

    setBusy(true);
    try {
      await client.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password changed. A confirmation email has been sent.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setServerError(errorMessage(err, 'Could not change password'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-hd">
        <h2>Change Password</h2>
        <p>Update your login password. An email notification will be sent after the change.</p>
      </div>

      {serverError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{serverError}</div>}
      {success    && <div className="alert alert-ok"    style={{ marginBottom: 16 }}>{success}</div>}

      <form className="card form narrow" onSubmit={submit} noValidate>
        <div className="form-section-label">Current credentials</div>
        <label>
          Current password
          <input type="password" value={form.currentPassword}
                 onChange={update('currentPassword')} autoComplete="current-password" />
          <FieldError msg={errors.currentPassword} />
        </label>

        <div className="form-section-label" style={{ marginTop: 4 }}>New password</div>
        <label>
          New password
          <input type="password" value={form.newPassword}
                 onChange={update('newPassword')}
                 autoComplete="new-password" placeholder="Min 8 characters" />
          <FieldError msg={errors.newPassword} />
        </label>
        <label>
          Confirm new password
          <input type="password" value={form.confirm}
                 onChange={update('confirm')}
                 autoComplete="new-password" placeholder="Repeat new password" />
          <FieldError msg={errors.confirm} />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
