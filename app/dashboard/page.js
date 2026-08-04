'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [warrantyEnd, setWarrantyEnd] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['orders', 'accounts', 'warranty'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (!res.ok) {
        setBuyer(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setBuyer(data.user);
      fetchUserData();
    } catch {
      setBuyer(null);
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const [ordersRes, accountsRes] = await Promise.all([
        fetch('/api/orders?action=my-orders').then(r => r.json()).catch(() => ({ orders: [] })),
        fetch('/api/user/saved-accounts').then(r => r.json()).catch(() => ({})),
      ]);

      setOrders(ordersRes.orders || ordersRes || []);
      setSavedAccounts(accountsRes || {});

      const now = new Date();
      setWarrantyEnd(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    window.location.href = '/';
  };

  const formatPaise = (paise) => `₹${(Number(paise) / 100).toLocaleString('en-IN')}`;

  const getStatusColor = (status) => {
    const base = 'status-badge';
    switch (status) {
      case 'delivered': return `${base} status-delivered`;
      case 'paid':
      case 'in_progress': return `${base} status-paid`;
      case 'cancelled': return `${base} status-cancelled`;
      default: return `${base} status-pending`;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'paid': return 'In Process';
      case 'in_progress': return 'In Process';
      case 'delivered': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusProgress = (status) => {
    switch (status) {
      case 'pending': return 10;
      case 'paid': return 40;
      case 'in_progress': return 70;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <p>Loading...</p>
      </main>
    );
  }

  if (!buyer) {
    return (
      <main className="page-shell">
        <header className="site-header">
          <a className="brand" href="/">GameVault <span>Pro</span></a>
          <nav className="site-nav">
            <a href="/">Home</a>
            <a href="/order">Order</a>
          </nav>
          <div className="auth-links">
            <a className="ghost-btn small" href="/signin?redirect=%2Fdashboard">Sign In</a>
            <a className="primary-btn small" href="/signup?redirect=%2Fdashboard">Sign Up</a>
          </div>
        </header>

        <div className="signin-required">
          <p>Sign in to view your orders and manage your account.</p>
          <div className="signin-required-actions">
            <a className="primary-btn" href="/signin?redirect=%2Fdashboard">Sign In</a>
            <a className="secondary-btn" href="/signup?redirect=%2Fdashboard">Sign Up</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="/">GameVault <span>Pro</span></a>
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/order">Order</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
        <div className="account-widget">
          <div className="account-widget-inner">
            <span className="user-name">{buyer.name}</span>
            <a className="ghost-btn small" href="/dashboard">Orders</a>
            <a className="ghost-btn small" href="/dashboard?tab=accounts">Profile</a>
            <button type="button" className="ghost-btn small" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`}
        >
          My Orders
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`dashboard-tab ${activeTab === 'accounts' ? 'active' : ''}`}
        >
          Saved Accounts
        </button>
        <button
          onClick={() => setActiveTab('warranty')}
          className={`dashboard-tab ${activeTab === 'warranty' ? 'active' : ''}`}
        >
          Warranty & Support
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="dashboard-content">
          <h2>My Orders</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No orders yet</h3>
              <p>Browse our catalog and place your first order!</p>
              <a href="/order" className="primary-btn">Place an Order</a>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-item-header">
                    <div>
                      <h3>{order.game}</h3>
                      <p className="order-meta">Order ID: {order.id}</p>
                      <p className="order-meta">Placed: {new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <span className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="order-progress">
                    <div className="order-progress-header">
                      <span>Progress</span>
                      <span>{getStatusProgress(order.status)}%</span>
                    </div>
                    <div className="order-progress-bar">
                      <div className="order-progress-fill" style={{ width: `${getStatusProgress(order.status)}%` }}></div>
                    </div>
                  </div>
                  <div className="order-amount">{formatPaise(order.amountPaise)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="dashboard-content">
          <h2>Saved Game Accounts</h2>
          <p className="dashboard-desc">Save your game account IDs for faster checkout.</p>
          <form className="saved-accounts-form">
            <div className="form-grid">
              <label>
                Steam ID
                <input defaultValue={savedAccounts.steamId || ''} placeholder="Steam ID" />
              </label>
              <label>
                Epic Games ID
                <input defaultValue={savedAccounts.epicId || ''} placeholder="Epic Games ID" />
              </label>
              <label>
                Social Club ID
                <input defaultValue={savedAccounts.socialClubId || ''} placeholder="Social Club ID" />
              </label>
              <label>
                PSN ID
                <input defaultValue={savedAccounts.psnId || ''} placeholder="PSN ID" />
              </label>
              <label>
                Xbox Live ID
                <input defaultValue={savedAccounts.xboxLiveId || ''} placeholder="Xbox Live ID" />
              </label>
              <label>
                Discord Username
                <input defaultValue={savedAccounts.discordUsername || ''} placeholder="Discord username" />
              </label>
            </div>
            <button type="submit" className="primary-btn">Save Accounts</button>
          </form>
        </div>
      )}

      {activeTab === 'warranty' && (
        <div className="dashboard-content">
          <h2>Warranty & Support</h2>
          <div className="warranty-grid">
            <div className="warranty-card">
              <h3>🛡️ Anti-Ban Warranty</h3>
              <p>All delivered orders come with a 30-day warranty.</p>
              <div className="warranty-info">
                <span className="warranty-count">{orders.filter(o => o.status === 'delivered').length} orders completed</span>
                <span className="warranty-date">Warranty expires: {warrantyEnd?.toLocaleDateString()}</span>
              </div>
            </div>
            <div className="warranty-card">
              <h3>💬 Discord Support</h3>
              <p>Get help from our support team on Discord.</p>
              <a href={process.env.NEXT_PUBLIC_DISCORD_LINK || '#'} target="_blank" rel="noopener noreferrer" className="secondary-btn">
                Join Discord
              </a>
            </div>
            <div className="warranty-card">
              <h3>📱 WhatsApp Support</h3>
              <p>Message us for quick support.</p>
              <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}`} target="_blank" rel="noopener noreferrer" className="secondary-btn">
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
