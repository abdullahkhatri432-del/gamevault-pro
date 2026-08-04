'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus(result.message || 'Failed to create account.');
        return;
      }

      setStatus('Account created! Redirecting...');
      setTimeout(() => window.location.href = redirect, 1000);
    } catch {
      setStatus('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Sign up to place orders and track deliveries.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
                minLength={2}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>

            <button type="submit" className="primary-btn full" disabled={busy}>
              {busy ? 'Creating account...' : 'Create Account'}
            </button>

            {status && <p className="auth-status">{status}</p>}
          </form>

          <p className="auth-footer">
            Already have an account? <a href={`/signin?redirect=${encodeURIComponent(redirect)}`}>Sign in</a>
          </p>
        </div>
      </div>
    </main>
  );
}
