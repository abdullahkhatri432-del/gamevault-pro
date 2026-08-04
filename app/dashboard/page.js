'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const GAMES_CONFIG = [
  { id: 'gta5', name: 'GTA V', icon: '🚗', color: '#F59E0B' },
  { id: 'valorant', name: 'Valorant', icon: '🔫', color: '#EF4444' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️', color: '#8B5CF6' },
  { id: 'forza', name: 'Forza Horizon', icon: '🏎️', color: '#06B6D4' },
  { id: 'other', name: 'Other Games', icon: '🎮', color: '#6B7280' },
];

const formatPaise = (paise) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN')}`;

function escapeHTML(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [savedAccounts, setSavedAccounts] = useState({
    steamId: '',
    epicId: '',
    socialClubId: '',
    psnId: '',
    xboxLiveId: '',
    discordUsername: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingAccounts, setSavingAccounts] = useState(false);
  const [accountStatus, setAccountStatus] = useState('');

  useEffect(() => {
    async function loadProfileData() {
      try {
        const [userResponse, ordersResponse] = await Promise.all([
          fetch('/api/users/me'),
          fetch('/api/orders?action=my-orders'),
        ]);

        if (!userResponse.ok) {
          router.replace('/');
          return;
        }

        const userData = await userResponse.json();
        setUser(userData.user);

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        }

        const savedResponse = await fetch('/api/user/saved-accounts');
        if (savedResponse.ok) {
          const savedData = await savedResponse.json();
          setSavedAccounts(savedData);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [router]);

  const handleSaveAccount = async (event) => {
    event.preventDefault();
    setSavingAccounts(true);
    setAccountStatus('');

    try {
      const response = await fetch('/api/user/saved-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedAccounts),
      });

      if (response.ok) {
        setAccountStatus('Account credentials saved successfully!');
      } else {
        const result = await response.json();
        setAccountStatus(result.message || 'Failed to save account credentials.');
      }
    } catch (error) {
      console.error('Error saving account credentials:', error);
      setAccountStatus('An error occurred while saving your account credentials.');
    } finally {
      setSavingAccounts(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
      paid: 'bg-blue-900/30 text-blue-400 border-blue-500',
      in_progress: 'bg-purple-900/30 text-purple-400 border-purple-500',
      delivered: 'bg-green-900/30 text-green-400 border-green-500',
      cancelled: 'bg-red-900/30 text-red-400 border-red-500',
    };
    return statusColors[status] || 'bg-gray-900/30 text-gray-400 border-gray-500';
  };

  const getStatusStepProgress = (status) => {
    const steps = [
      { status: 'pending', label: 'Order Placed', icon: '📋' },
      { status: 'paid', label: 'Payment Received', icon: '💰' },
      { status: 'in_progress', label: 'Agent Working', icon: '🔐' },
      { status: 'delivered', label: 'Delivered', icon: '✅' },
    ];

    const currentStepIndex = steps.findIndex((step) => step.status === status);
    const completedSteps = currentStepIndex >= 0 ? currentStepIndex + 1 : 0;

    return { steps, completedSteps };
  };

  const generateInvoice = (order) => {
    const invoiceWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!invoiceWindow) {
      alert('Please allow popups to download the invoice.');
      return;
    }

    const gameConfig = GAMES_CONFIG.find((g) => g.id === order.gameId) || { name: 'Gaming Services' };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${escapeHTML(order.id)}</title>
          <style>
            body { font-family: monospace; background-color: #09090B; color: #ffffff; padding: 40px; font-size: 14px; }
            .invoice-container { max-width: 600px; margin: 0 auto; background-color: #18181B; padding: 30px; border: 2px solid #8B5CF6; }
            .header { text-align: center; border-bottom: 2px solid #8B5CF6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; color: #8B5CF6; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #06B6D4; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; color: #10B981; border-bottom: 1px solid #374151; padding-bottom: 5px; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 10px; }
            .label { color: #9CA3AF; font-size: 12px; }
            .value { color: #ffffff; font-size: 14px; font-weight: bold; }
            .total { font-size: 20px; color: #8B5CF6; border-top: 2px solid #8B5CF6; padding-top: 15px; margin-top: 20px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 5px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #374151; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="title">GAMEVAULT PRO</div>
              <div class="subtitle">Invoice #${escapeHTML(order.id)}</div>
              <div>Game: ${escapeHTML(gameConfig.name)}</div>
              <div>Date: ${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>

            <div class="section">
              <div class="section-title">Customer Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">Customer Name</div>
                  <div class="value">${escapeHTML(order.name)}</div>
                </div>
                <div class="info-item">
                  <div class="label">Email</div>
                  <div class="value">${escapeHTML(order.email)}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Order Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">Service</div>
                  <div class="value">${escapeHTML(order.game)}</div>
                </div>
                <div class="info-item">
                  <div class="label">Launcher</div>
                  <div class="value">${escapeHTML(order.launcher)}</div>
                </div>
                <div class="info-item">
                  <div class="label">Service Type</div>
                  <div class="value">${escapeHTML(order.serviceType || 'Not specified')}</div>
                </div>
                <div class="info-item">
                  <div class="label">Order Status</div>
                  <div class="value">
                    <span class="status-badge ${getStatusColor(order.status)}">
                      ${escapeHTML(order.status.charAt(0).toUpperCase() + order.status.slice(1))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Payment Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="label">Amount</div>
                  <div class="value">${formatPaise(order.amountPaise)}</div>
                </div>
                <div class="info-item">
                  <div class="label">Discount Applied</div>
                  <div class="value">${order.discountPaise > 0 ? formatPaise(order.discountPaise) : 'None'}</div>
                </div>
                <div class="info-item">
                  <div class="label">Final Amount</div>
                  <div class="value" class="total">${formatPaise(order.amountPaise - (order.discountPaise || 0))}</div>
                </div>
                <div class="info-item">
                  <div class="label">Payment Status</div>
                  <div class="value">
                    <span class="status-badge ${order.status === 'paid' || order.status === 'delivered' ? 'bg-green-900/30 text-green-400 border-green-500' : 'bg-yellow-900/30 text-yellow-400 border-yellow-500'}">
                      ${order.status === 'paid' || order.status === 'delivered' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing GameVault Pro for your ${escapeHTML(gameConfig.name)} gaming needs!</p>
              <p>This invoice is generated electronically and is valid for tax purposes.</p>
              <p>For support, contact us via Discord or WhatsApp mentioned in your account settings.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
    invoiceWindow.print();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090B] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
            <p className="mt-4 text-[#9CA3AF]">Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  const ordersByGame = GAMES_CONFIG.map((game) => ({
    ...game,
    count: orders.filter((o) => o.gameId === game.id).length,
  })).filter((g) => g.count > 0);

  return (
    <main className="min-h-screen bg-[#09090B] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <a href="/" className="text-2xl font-bold text-[#8B5CF6]">GameVault <span className="text-white">Pro</span></a>
          <div className="flex gap-4">
            <a href="/" className="px-4 py-2 bg-[#27272A] hover:bg-[#374151] rounded-lg transition-colors">Home</a>
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.replace('/');
              }}
              className="px-4 py-2 bg-[#27272A] hover:bg-[#374151] rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="bg-[#18181B] border border-[#374151] rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-full flex items-center justify-center text-3xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{user?.name || 'Guest User'}</h1>
              <p className="text-[#9CA3AF] mb-2">{user?.email}</p>
              <div className="flex gap-4 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#10B981]/20 text-[#10B981] rounded-full text-sm">
                  <span>🛡️</span>
                  30-Day Warranty
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full text-sm">
                  <span>⭐</span>
                  Premium Member
                </span>
                {ordersByGame.map((game) => (
                  <span key={game.id} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: `${game.color}20`, color: game.color }}>
                    <span>{game.icon}</span>
                    {game.count} {game.name} order{game.count !== 1 ? 's' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#18181B] border border-[#374151] rounded-xl mb-8">
          <div className="flex border-b border-[#374151]">
            {['orders', 'accounts', 'warranty'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${activeTab === tab
                    ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-b-2 border-[#8B5CF6]'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#27272A]'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h3>No orders yet</h3>
                    <p>You haven&apos;t placed any orders yet.</p>
                    <a href="/#catalog" className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors inline-block mt-4">
                      Browse Services
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const { steps, completedSteps } = getStatusStepProgress(order.status);
                      const gameConfig = GAMES_CONFIG.find((g) => g.id === order.gameId) || { icon: '🎮', name: 'Game', color: '#6B7280' };
                      return (
                        <div key={order.id} className="bg-[#27272A] border border-[#374151] rounded-lg p-6 hover:border-[#8B5CF6]/50 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{gameConfig.icon}</span>
                                <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: `${gameConfig.color}20`, color: gameConfig.color }}>
                                  {gameConfig.name}
                                </span>
                                {order.serviceType && (
                                  <span className="px-2 py-1 bg-[#374151] rounded text-xs text-[#9CA3AF]">
                                    {order.serviceType.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold mb-2">{order.game}</h3>
                              <p className="text-[#9CA3AF] text-sm">Order ID: {order.id}</p>
                              <p className="text-[#9CA3AF] text-sm">Placed: {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}` }>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <p className="text-[#9CA3AF] text-sm mt-1">{formatPaise(order.amountPaise)}</p>
                            </div>
                          </div>

                          <div className="mb-6">
                            <div className="flex justify-between text-sm text-[#9CA3AF] mb-2">
                              {steps.map((step, index) => (
                                <div
                                  key={step.status}
                                  className={`text-center ${index < completedSteps ? 'text-[#10B981]' : 'text-[#9CA3AF]'}`}
                                >
                                  <div className="text-2xl mb-1">{step.icon}</div>
                                  <div className="text-xs">{step.label}</div>
                                </div>
                              ))}
                            </div>
                            <div className="w-full bg-[#374151] rounded-full h-2">
                              <div
                                className="bg-[#10B981] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex gap-3 flex-wrap">
                            <button
                              onClick={() => generateInvoice(order)}
                              className="px-4 py-2 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 text-[#8B5CF6] rounded-lg transition-colors text-sm"
                            >
                              📄 Download Invoice
                            </button>
                            {order.status !== 'pending' && (
                              <button
                                onClick={() => {
                                  const chatWindow = window.open(`/dashboard/chat/${order.id}`, '_blank', 'width=600,height=700');
                                }}
                                className="px-4 py-2 bg-[#06B6D4]/20 hover:bg-[#06B6D4]/40 text-[#06B6D4] rounded-lg transition-colors text-sm"
                              >
                              💬 Chat with Booster
                            </button>
                            )}
                            {order.status === 'delivered' && (
                              <>
                                <span className="px-4 py-2 bg-[#10B981]/20 text-[#10B981] rounded-lg text-sm">
                                  ✅ Delivered Successfully
                                </span>
                                {(() => {
                                  const deliveredAt = new Date(order.createdAt);
                                  const warrantyEnd = new Date(deliveredAt.getTime() + 30 * 24 * 60 * 60 * 1000);
                                  const now = new Date();
                                  const remainingMs = warrantyEnd - now;
                                  if (remainingMs > 0) {
                                    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
                                    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                    return (
                                      <div className="px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-sm">
                                        <p className="text-[#10B981] font-medium">🛡️ 30-Day Anti-Ban Warranty Active</p>
                                        <p className="text-[#9CA3AF] text-xs mt-1">Expires in {days}d {hours}h — {warrantyEnd.toLocaleDateString()}</p>
                                      </div>
                                    );
                                  }
                                  return (
                                    <span className="px-4 py-2 bg-[#EF4444]/20 text-[#EF4444] rounded-lg text-sm">
                                      ❌ Warranty Expired
                                    </span>
                                  );
                                })()}
                                {(() => {
                                  const deliveredAt = new Date(order.createdAt);
                                  const now = new Date();
                                  const hoursSinceDelivery = (now - deliveredAt) / (1000 * 60 * 60);
                                  if (hoursSinceDelivery <= 24) {
                                    return (
                                      <button
                                        onClick={async () => {
                                          const description = prompt('Describe the order discrepancy (you have 24 hours from delivery to report):');
                                          if (!description) return;
                                          const response = await fetch('/api/anomaly-reports', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ orderId: order.id, description }),
                                          });
                                          const result = await response.json();
                                          alert(result.message);
                                        }}
                                        className="px-4 py-2 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/40 text-[#F59E0B] rounded-lg transition-colors text-sm"
                                      >
                                        ⚠️ Report Order Anomaly
                                      </button>
                                    );
                                  }
                                  return (
                                    <span className="px-4 py-2 bg-[#374151]/50 text-[#9CA3AF] rounded-lg text-sm">
                                      24-hour reporting window passed
                                    </span>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'accounts' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Saved Game Accounts</h2>
                <p className="text-[#9CA3AF] mb-6">Save your game account IDs for faster checkout. These are stored securely and used to pre-fill your order forms.</p>
                <form onSubmit={handleSaveAccount} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Steam ID</label>
                      <input
                        type="text"
                        value={savedAccounts.steamId}
                        onChange={(e) => setSavedAccounts({ ...savedAccounts, steamId: e.target.value })}
                        placeholder="e.g., 76561198012345678"
                        className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Epic Games ID</label>
                      <input
                        type="text"
                        value={savedAccounts.epicId}
                        onChange={(e) => setSavedAccounts({ ...savedAccounts, epicId: e.target.value })}
                        placeholder="e.g., your-epic-id"
                        className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Social Club ID</label>
                      <input
                        type="text"
                        value={savedAccounts.socialClubId}
                        onChange={(e) => setSavedAccounts({ ...savedAccounts, socialClubId: e.target.value })}
                        placeholder="e.g., player123"
                        className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-2">PSN ID</label>
                      <input
                        type="text"
                        value={savedAccounts.psnId}
                        onChange={(e) => setSavedAccounts({ ...savedAccounts, psnId: e.target.value })}
                        placeholder="e.g., player@example.com"
                        className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Xbox Live ID</label>
                      <input
                        type="text"
                        value={savedAccounts.xboxLiveId}
                        onChange={(e) => setSavedAccounts({ ...savedAccounts, xboxLiveId: e.target.value })}
                        placeholder="e.g., player@example.com"
                        className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Discord Username</label>
                      <input
                        type="text"
                        value={savedAccounts.discordUsername}
                        onChange={(e) => setSavedAccounts({ ...savedAccounts, discordUsername: e.target.value })}
                        placeholder="e.g., gamer#1234"
                        className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={savingAccounts}
                    className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {savingAccounts ? 'Saving...' : '💾 Save Account Credentials'}
                  </button>
                  {accountStatus && (
                    <p className={`text-sm ${accountStatus.includes('success') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {accountStatus}
                    </p>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'warranty' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Warranty & Support</h2>
                <div className="space-y-6">
                  <div className="bg-[#27272A] border border-[#374151] rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">🛡️ Anti-Ban Warranty</h3>
                    <p className="text-[#9CA3AF] mb-4">All delivered orders come with a 30-day warranty. If you encounter any issues with your order, contact us for resolution.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {orders
                        .filter((order) => order.status === 'delivered')
                        .slice(0, 3)
                        .map((order) => {
                          const gameConfig = GAMES_CONFIG.find((g) => g.id === order.gameId) || { icon: '🎮', color: '#6B7280' };
                          return (
                            <div
                              key={order.id}
                              className="bg-gradient-to-r from-[#10B981]/20 to-[#10B981]/10 border border-[#10B981]/30 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg">{gameConfig.icon}</span>
                                <span className="text-xs text-[#9CA3AF]">{new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-semibold mb-1">{order.game}</h4>
                              <p className="text-sm text-[#10B981]">Delivered</p>
                              <div className="mt-2">
                                <div className="text-xs text-[#9CA3AF]">Warranty expires:</div>
                                <div className="text-sm font-bold text-[#10B981]">
                                  {new Date(new Date(order.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {orders.filter((order) => order.status === 'delivered').length === 0 && (
                        <div className="col-span-full empty-state">
                          <div className="empty-state-icon">🛡️</div>
                          <h3>No active warranties</h3>
                          <p>Complete an order to receive warranty coverage.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#27272A] border border-[#374151] rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">📞 Support</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Discord Support</h4>
                          <p className="text-sm text-[#9CA3AF]">Get help from our support team on Discord</p>
                        </div>
                        <a href={process.env.NEXT_PUBLIC_DISCORD_LINK || '#'} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-[#5865F2] rounded-lg transition-colors text-sm">
                          Join Discord
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">WhatsApp Support</h4>
                          <p className="text-sm text-[#9CA3AF]">Message us on WhatsApp for quick support</p>
                        </div>
                        <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#25D366]/20 hover:bg-[#25D366]/40 text-[#25D366] rounded-lg transition-colors text-sm">
                          Message Us
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
