'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMessage('Signed in! Redirecting...');
        setTimeout(() => window.location.href = '/admin', 1000);
      } else {
        const result = await response.json();
        setMessage(result.message || 'Invalid credentials.');
      }
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="admin-lock-icon">🔒</span>
            <h1>Admin Access</h1>
            <p>Sign in to manage your store.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Username
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Admin username"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Admin password"
                required
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="primary-btn full" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign In'}
            </button>

            {message && <p className="auth-status">{message}</p>}
          </form>

          <p className="auth-footer">
            <a href="/">← Back to store</a>
          </p>
        </div>
      </div>
    </main>
  );
}
