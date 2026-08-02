'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      const result = await response.json();
      setMessage(result.message || 'Unable to sign in to the admin area.');
    }
  };

  return (
    <main className="admin-shell">
      <section className="admin-card login-card">
        <span className="eyebrow">Admin access</span>
        <h1>Sign in to your dashboard</h1>
        <form className="order-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button type="submit" className="primary-btn full">Sign in</button>
          {message ? <p className="status-text">{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
