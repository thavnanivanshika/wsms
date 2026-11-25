import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { errorMessage } from '../api/client.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password.trim());
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, 'Login failed — check your username and password.'));
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
          Web Based Stationery Management System<br />
          Streamline your institutional stationery workflow
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feat-dot" />
            Role-based access &amp; eligibility caps
          </div>
          <div className="auth-feature">
            <div className="auth-feat-dot" />
            Multi-item requests with approval workflow
          </div>
          <div className="auth-feature">
            <div className="auth-feat-dot" />
            Automatic email notifications on every action
          </div>
          <div className="auth-feature">
            <div className="auth-feat-dot" />
            Cost report &amp; stock management for managers
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-pane">
        <div className="auth-form-box">
          <div className="auth-form-title">Sign in</div>
          <div className="auth-form-sub">Enter your credentials to access WSMS.</div>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit} className="form">
            <label>
              Username
              <input
                autoFocus
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            <button className="btn btn-primary btn-full" disabled={busy} style={{ marginTop: 4 }}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="muted small" style={{ marginTop: 20, textAlign: 'center' }}>
            No account? <Link to="/register">Create one</Link>
          </p>
          <p className="muted small" style={{ marginTop: 10, textAlign: 'center' }}>
            Demo:&nbsp; <code>manager / manager123</code>&nbsp;·&nbsp;<code>user / user123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
