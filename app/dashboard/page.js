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
  const [reports, setReports] = useState([]);

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
      const [ordersRes, accountsRes, reportsRes] = await Promise.all([
        fetch('/api/orders?action=my-orders').then(r => r.json()).catch(() => ({ orders: [] })),
        fetch('/api/user/saved-accounts').then(r => r.json()).catch(() => ({})),
        fetch('/api/user/reports').then(r => r.json()).catch(() => ({ reports: [] })),
      ]);

      setOrders(ordersRes.orders || ordersRes || []);
      setSavedAccounts(accountsRes || {});
      setReports(reportsRes.reports || []);

      const now = new Date();
      setWarrantyEnd(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    window.location.href = '/';
  };

  const formatPaise = (paise) => String.fromCharCode(8377) + (Number(paise) / 100).toLocaleString('en-IN');

  const getStatusColor = (status) => {
    const base = 'status-badge';
    switch (status) {
      case 'delivered': return base + ' status-delivered';
      case 'paid':
      case 'in_progress': return base + ' status-paid';
      case 'cancelled': return base + ' status-cancelled';
      default: return base + ' status-pending';
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
        <button onClick={() => setActiveTab("orders")} className={`dashboard-tab ${activeTab === "orders" ? "active" : ""}`}>My Orders</button>
        <button onClick={() => setActiveTab("accounts")} className={`dashboard-tab ${activeTab === "accounts" ? "active" : ""}`}>Saved Accounts</button>
        <button onClick={() => setActiveTab("warranty")} className={`dashboard-tab ${activeTab === "warranty" ? "active" : ""}`}>Warranty & Support</button>
      </div>

      {activeTab === "orders" && (
        <div className="dashboard-content">
          <h2>My Orders</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">No Orders</div>
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
                    <span className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</span>
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

      {activeTab === "accounts" && (
        <div className="dashboard-content">
          <h2>Saved Game Accounts</h2>
          <p className="dashboard-desc">Save your game account IDs for faster checkout.</p>
          <form className="saved-accounts-form">
            <div className="form-grid">
              <label>Steam ID<input defaultValue={savedAccounts.steamId || ""} placeholder="Steam ID" /></label>
              <label>Epic Games ID<input defaultValue={savedAccounts.epicId || ""} placeholder="Epic Games ID" /></label>
              <label>Social Club ID<input defaultValue={savedAccounts.socialClubId || ""} placeholder="Social Club ID" /></label>
              <label>PSN ID<input defaultValue={savedAccounts.psnId || ""} placeholder="PSN ID" /></label>
              <label>Xbox Live ID<input defaultValue={savedAccounts.xboxLiveId || ""} placeholder="Xbox Live ID" /></label>
              <label>Discord Username<input defaultValue={savedAccounts.discordUsername || ""} placeholder="Discord username" /></label>
            </div>
            <button type="submit" className="primary-btn">Save Accounts</button>
          </form>
        </div>
      )}

      {activeTab === "warranty" && (
        <div className="dashboard-content">
          <h2>Warranty & Support</h2>
          <div className="warranty-grid">
            <div className="warranty-card">
              <h3>Anti-Ban Warranty</h3>
              <p>All delivered orders come with a 30-day warranty from the date of delivery.</p>
              <div className="warranty-info">
                <span className="warranty-count">{orders.filter(o => o.status === "delivered").length} delivered orders</span>
              </div>
            </div>
            <div className="warranty-card">
              <h3>Submit a Report</h3>
              <p>Having an issue with a delivered order? File a warranty report within 24 hours of delivery.</p>
              <a href="/safety" className="secondary-btn">File Report</a>
            </div>
            <div className="warranty-card">
              <h3>Need Help?</h3>
              <p>Contact our support team directly.</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <a href={process.env.NEXT_PUBLIC_DISCORD_LINK || "#"} target="_blank" rel="noopener noreferrer" className="secondary-btn">Discord</a>
                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}`} target="_blank" rel="noopener noreferrer" className="secondary-btn">WhatsApp</a>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3>Your Warranty Reports</h3>
            {reports.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">No Reports</div>
                <h3>No reports yet</h3>
                <p>If you have an issue with a delivered order, submit a warranty report.</p>
              </div>
            ) : (
              <div className="orders-list">
                {reports.map((report) => (
                  <div key={report.id} className="order-item">
                    <div className="order-item-header">
                      <div>
                        <h3>{report.report_type === "order_discrepancy" ? "Order Discrepancy" : report.report_type === "account_issue" ? "Account Issue" : report.report_type === "ban_report" ? "Ban Report" : report.report_type}</h3>
                        <p className="order-meta">Report #{report.id} &middot; Order: {report.order_id}</p>
                        {report.game && <p className="order-meta">Service: {report.game}</p>}
                        <p className="order-meta">Submitted: {new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`status-badge ${report.status === "resolved" ? "status-delivered" : report.status === "rejected" ? "status-cancelled" : report.status === "approved" ? "status-paid" : "status-pending"}`}>
                        {report.status === "submitted" ? "Submitted" : report.status === "under_review" ? "Under Review" : report.status === "approved" ? "Approved" : report.status === "rejected" ? "Rejected" : report.status === "resolved" ? "Resolved" : report.status}
                      </span>
                    </div>
                    <p style={{ color: "#D1D5DB", marginTop: "0.5rem", fontSize: "0.9rem" }}>{report.description}</p>
                    {report.status === "under_review" && <p style={{ color: "#F59E0B", fontSize: "0.85rem", marginTop: "0.5rem" }}>Our team is reviewing your report. We will update you soon.</p>}
                    {report.status === "approved" && <p style={{ color: "#10B981", fontSize: "0.85rem", marginTop: "0.5rem" }}>Your warranty claim has been approved. Our team will contact you with next steps.</p>}
                    {report.status === "rejected" && <p style={{ color: "#EF4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>Your warranty claim was not approved. If you believe this is an error, please contact support.</p>}
                    {report.status === "resolved" && <p style={{ color: "#10B981", fontSize: "0.85rem", marginTop: "0.5rem" }}>This issue has been resolved. Thank you for your patience.</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
