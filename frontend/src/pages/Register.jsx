import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import client, { errorMessage, fieldErrors } from '../api/client.js';
import FieldError from '../components/FieldError.jsx';

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

function validate(form) {
  const e = {};
  if (!form.username.trim()) {
    e.username = 'Username is required.';
  } else if (form.username.length < 3 || form.username.length > 50) {
    e.username = 'Username must be 3–50 characters.';
  } else if (!USERNAME_RE.test(form.username)) {
    e.username = 'Username may only contain letters, digits and underscores ( _ ).';
  }
  if (!form.email.trim()) {
    e.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    e.email = 'Enter a valid email address.';
  }
  if (!form.password) {
    e.password = 'Password is required.';
  } else if (form.password.length < 8) {
    e.password = 'Password must be at least 8 characters.';
  }
  if (!form.confirm) {
    e.confirm = 'Please confirm your password.';
  } else if (form.password !== form.confirm) {
    e.confirm = 'Passwords do not match.';
  }
  if (!form.departmentId) {
    e.departmentId = 'Please select a department.';
  }
  return e;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm: '',
    departmentId: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client
      .get('/meta')
      .then(res => {
        setMeta(res.data);
        setForm(f => ({
          ...f,
          departmentId: res.data.departments[0]?.id ?? '',
        }));
      })
      .catch(err => setServerError(errorMessage(err)));
  }, []);

  function update(field) {
    return e => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm(f => ({ ...f, [field]: value }));
      // Clear the field error as soon as the user starts correcting it
      if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };
  }

  async function submit(e) {
    e.preventDefault();
    setServerError('');
    const clientErrors = validate(form);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        departmentId: Number(form.departmentId),
      });
      navigate('/');
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length > 0) {
        setErrors(fe);
      } else {
        setServerError(errorMessage(err, 'Registration failed'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      {/* Brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-logo">📎</div>
        <div className="auth-brand-title">WSMS</div>
        <div className="auth-brand-sub">
          Create your account to start requesting stationery and tracking approvals.
        </div>
        <div className="auth-features">
          <div className="auth-feature"><div className="auth-feat-dot" />₹5,000 stationery budget per request cycle</div>
          <div className="auth-feature"><div className="auth-feat-dot" />Link to your department</div>
          <div className="auth-feature"><div className="auth-feat-dot" />Instant access after registration</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-pane">
        <div className="auth-form-box" style={{ maxWidth: 460 }}>
          <div className="auth-form-title">Create account</div>
          <div className="auth-form-sub">Fill in your details to get started.</div>

          {serverError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{serverError}</div>}

          <form onSubmit={submit} className="form" noValidate>
            <div className="form-section-label">Account credentials</div>

            <label>
              Username
              <input
                value={form.username}
                onChange={update('username')}
                placeholder="letters, digits, underscore"
                autoComplete="username"
              />
              <FieldError msg={errors.username} />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <FieldError msg={errors.email} />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
              <FieldError msg={errors.password} />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                value={form.confirm}
                onChange={update('confirm')}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
              <FieldError msg={errors.confirm} />
            </label>

            <div className="form-section-label" style={{ marginTop: 4 }}>Institution profile</div>

            <label>
              Department
              <select value={form.departmentId} onChange={update('departmentId')}>
                {meta?.departments.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <FieldError msg={errors.departmentId} />
            </label>

            <button className="btn btn-primary btn-full" disabled={busy || !meta} style={{ marginTop: 4 }}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="muted small" style={{ marginTop: 20, textAlign: 'center' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
