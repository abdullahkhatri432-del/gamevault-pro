'use client';

import { useEffect, useRef, useState } from 'react';
import { setCookie, getCookie } from '../../lib/cookies';

const GAMES_CONFIG = [
  { id: 'gta5', name: 'GTA V', icon: '🚗', color: '#F59E0B' },
  { id: 'valorant', name: 'Valorant', icon: '🔫', color: '#EF4444' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️', color: '#8B5CF6' },
  { id: 'forza', name: 'Forza Horizon', icon: '🏎️', color: '#06B6D4' },
  { id: 'other', name: 'Other Games', icon: '🎮', color: '#6B7280' },
];

const LAUNCHERS_BY_GAME = {
  gta5: ['Steam', 'Epic Games', 'Rockstar Launcher'],
  valorant: ['Riot Client'],
  fortnite: ['Epic Games'],
  forza: ['Xbox App', 'Steam'],
  other: ['Steam', 'Epic Games'],
};

const PLATFORMS_BY_GAME = {
  gta5: ['PC', 'PS5', 'Xbox'],
  valorant: ['PC'],
  fortnite: ['PC', 'PS5', 'Xbox'],
  forza: ['PC', 'Xbox'],
  other: ['PC', 'PS5', 'Xbox'],
};

const SERVICE_TYPES = {
  gta5: [
    { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and deliver services on your account' },
    { id: 'lobby_carry', label: 'In-Game Lobby / Carry', badge: 'no_login', description: 'Only Gamertag needed to join session' },
    { id: 'premade_account', label: 'Premade Account', badge: 'login_required', description: 'Temporary credentials required for direct injection' },
  ],
  valorant: [
    { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and rank up your account' },
    { id: 'boosting', label: 'Rank Boosting', badge: 'login_required', description: 'We play on your account to reach target rank' },
    { id: 'premade_account', label: 'Premade Account', badge: 'login_required', description: 'Receive an account with desired rank and skins' },
  ],
  fortnite: [
    { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and complete challenges on your account' },
    { id: 'lobby_carry', label: 'Carry / Lobby', badge: 'no_login', description: 'Only Gamertag needed to join session' },
    { id: 'premade_account', label: 'Premade Account', badge: 'login_required', description: 'Receive an account with skins and V-Bucks' },
  ],
  forza: [
    { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and unlock cars and credits' },
    { id: 'lobby_carry', label: 'Session Service', badge: 'no_login', description: 'Only Gamertag needed to join session' },
    { id: 'premade_account', label: 'Premade Account', badge: 'login_required', description: 'Receive an account with garage and credits' },
  ],
  other: [
    { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and deliver services on your account' },
    { id: 'boosting', label: 'Boosting', badge: 'login_required', description: 'We play on your account to achieve goals' },
    { id: 'premade_account', label: 'Premade Account', badge: 'login_required', description: 'Receive a ready-to-play account' },
  ],
};

const LAUNCHER_STATUSES = {
  Steam: 'active',
  'Epic Games': 'inactive',
  'Rockstar Launcher': 'inactive',
  'Riot Client': 'active',
  'Xbox App': 'active',
};

const LAUNCHER_ICONS = {
  Steam: '⚙️',
  'Epic Games': '🎮',
  'Rockstar Launcher': '🏍️',
  'Riot Client': '🔫',
  'Xbox App': '🎮',
};

export default function OrderPage() {
  const [form, setForm] = useState({
    game: '',
    gameId: 'gta5',
    launcher: 'Steam',
    launcherId: '',
    platformType: 'PC',
    serviceType: 'account_recovery',
    accountId: '',
    accountPassword: '',
    note: '',
    couponCode: '',
    discordUsername: '',
  });
  const [buyer, setBuyer] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [orderBusy, setOrderBusy] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const currentServiceTypes = SERVICE_TYPES[form.gameId] || SERVICE_TYPES.gta5;
  const currentLaunchers = LAUNCHERS_BY_GAME[form.gameId] || ['Steam'];
  const currentPlatforms = PLATFORMS_BY_GAME[form.gameId] || ['PC'];

  const refreshBuyerSession = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        setBuyer(null);
        return;
      }
      const result = await response.json();
      setBuyer(result.user || null);
    } catch {
      setBuyer(null);
    }
  };

  const fetchStoreData = async () => {
    const response = await fetch('/api/store');
    if (response.ok) {
      const store = await response.json();
      setReviews(store.reviews);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    window.location.href = '/';
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    const serviceParam = params.get('service');
    const nameParam = params.get('name');
    const platformParam = params.get('platform');
    const launcherParam = params.get('launcher');

    if (gameParam) {
      const game = GAMES_CONFIG.find(g => g.id === gameParam);
      if (game) {
        setForm(prev => ({
          ...prev,
          gameId: gameParam,
          game: nameParam || game.name,
          launcher: launcherParam || LAUNCHERS_BY_GAME[gameParam]?.[0] || 'Steam',
          platformType: platformParam || PLATFORMS_BY_GAME[gameParam]?.[0] || 'PC',
          serviceType: serviceParam || SERVICE_TYPES[gameParam]?.[0]?.id || 'account_recovery',
        }));
      }
    } else if (serviceParam) {
      setForm(prev => ({ ...prev, serviceType: serviceParam }));
    }

    refreshBuyerSession();
    fetchStoreData();

    const productId = params.get('productId');
    if (productId) {
      fetch(`/api/store`)
        .then(r => r.json())
        .then(store => {
          const product = store.featuredAccounts.find(p => String(p.id) === String(productId));
          if (product) setSelectedProduct(product);
        })
        .catch(() => {});
    }

    const saved = getCookie('checkout_data');
    if (saved) {
      setForm(prev => ({
        ...prev,
        launcherId: saved.launcherId || prev.launcherId,
        accountId: saved.accountId || prev.accountId,
        psnId: saved.psnId || prev.psnId,
        xboxLiveId: saved.xboxLiveId || prev.xboxLiveId,
        discordUsername: saved.discordUsername || prev.discordUsername,
        platformType: saved.platformType || prev.platformType,
        launcher: saved.launcher || prev.launcher,
      }));
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      setRazorpayReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);
  }, []);

  const handleGameChange = (gameId) => {
    setForm((current) => ({
      ...current,
      gameId,
      launcher: LAUNCHERS_BY_GAME[gameId]?.[0] || 'Steam',
      platformType: PLATFORMS_BY_GAME[gameId]?.[0] || 'PC',
      serviceType: 'account_recovery',
    }));
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();

    if (!buyer) {
      setOrderStatus('Please sign in to place an order.');
      return;
    }

    if (!form.launcher) {
      setOrderStatus('Please select your launcher.');
      return;
    }

    setOrderBusy(true);
    setOrderStatus('Saving your order and preparing secure checkout...');

    setCookie('checkout_data', {
      launcherId: form.launcherId,
      accountId: form.accountId,
      psnId: form.psnId,
      xboxLiveId: form.xboxLiveId,
      discordUsername: form.discordUsername,
      platformType: form.platformType,
      launcher: form.launcher,
    });

    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, game: form.game || 'Custom Order' }),
      });

      if (!orderResponse.ok) {
        const result = await orderResponse.json();
        setOrderStatus(result.message || 'Something went wrong while placing the order.');
        return;
      }

      const order = await orderResponse.json();

      const paymentResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok) {
        setOrderStatus(paymentResult.message || 'Razorpay checkout could not be initialized.');
        return;
      }

      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        setOrderStatus('Add NEXT_PUBLIC_RAZORPAY_KEY_ID to your environment to enable Razorpay checkout.');
        return;
      }

      if (!razorpayReady || typeof window === 'undefined' || !window.Razorpay) {
        setOrderStatus('Razorpay script is not ready yet. Reload the page or configure your keys.');
        return;
      }

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        name: 'GameVault Pro',
        description: `Payment for ${form.game || 'Order'}`,
        order_id: paymentResult.id,
        prefill: {
          name: buyer?.name || '',
          email: buyer?.email || '',
        },
        handler: async function (paymentResponseData) {
          setOrderStatus('Payment received. Verifying your Razorpay signature...');

          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpay_order_id: paymentResponseData.razorpay_order_id,
              razorpay_payment_id: paymentResponseData.razorpay_payment_id,
              razorpay_signature: paymentResponseData.razorpay_signature,
            }),
          });

          const verifyResult = await verifyResponse.json();
          if (!verifyResponse.ok) {
            setOrderStatus(verifyResult.message || 'Payment verification failed. Please contact support.');
            return;
          }

          localStorage.setItem('gvp_lastOrder', JSON.stringify({
            gameId: form.gameId,
            launcher: form.launcher,
            serviceType: form.serviceType,
          }));
          window.location.href = '/order/success';
        },
        theme: {
          color: '#5eead4',
        },
        modal: {
          ondismiss: () => {
            setOrderStatus('Checkout was closed before payment completed. Your order is saved as pending.');
          },
        },
      });

      setOrderStatus(
        order.discountPaise > 0
          ? `Promo ${order.couponCode} applied: ₹${(order.discountPaise / 100).toLocaleString('en-IN')} off. Order saved. Complete the Razorpay checkout to confirm your purchase.`
          : 'Order saved. Complete the Razorpay checkout to confirm your purchase.'
      );
      razorpay.open();
    } finally {
      setOrderBusy(false);
    }
  };

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
          {buyer ? (
            <div className="account-widget-inner">
              <span className="user-name">{buyer.name}</span>
              <a className="ghost-btn small" href="/dashboard">Orders</a>
              <a className="ghost-btn small" href="/dashboard?tab=accounts">Profile</a>
              <button type="button" className="ghost-btn small" onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <div className="auth-links">
              <a className="ghost-btn small" href="/signin?redirect=%2Forder">Sign In</a>
              <a className="primary-btn small" href="/signup?redirect=%2Forder">Sign Up</a>
            </div>
          )}
        </div>
      </header>

      <div className="main-wrapper">
        <section className="eyebrow-section">
          <span className="eyebrow">Place your order</span>
          <h1>Request a purchase</h1>
        </section>

        {!buyer ? (
          <div className="signin-required">
            <p>You need to sign in to place an order.</p>
            <div className="signin-required-actions">
              <a className="primary-btn" href="/signin?redirect=%2Forder">Sign In</a>
              <a className="secondary-btn" href="/signup?redirect=%2Forder">Sign Up</a>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleOrderSubmit} className="order-form">
          <div className="identity-card">
            <div>
              <span>Ordering as</span>
              <strong>{buyer ? buyer.name : '—'}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{buyer ? buyer.email : '—'}</strong>
            </div>
          </div>

          <div className="order-game-display">
            <span className="order-game-icon">{GAMES_CONFIG.find(g => g.id === form.gameId)?.icon || '🎮'}</span>
            <div>
              <strong>{form.game || GAMES_CONFIG.find(g => g.id === form.gameId)?.name || 'Select a game from the catalog'}</strong>
              <span className="order-game-hint">Selected from catalog</span>
            </div>
          </div>

          <div className="order-service-display">
            <span className="order-service-icon">{SERVICE_BADGES[currentServiceTypes.find(s => s.id === form.serviceType)?.badge || 'login_required']?.icon || '🔑'}</span>
            <div>
              <strong>{currentServiceTypes.find(s => s.id === form.serviceType)?.label || form.serviceType}</strong>
              <span className="order-game-hint">Service type</span>
            </div>
          </div>

          {selectedProduct && (
            <div className="order-service-details">
              <h3 className="order-service-details-title">Service Details</h3>
              <div className="order-details-grid">
                {selectedProduct.platform && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Platform</span>
                    <span className="order-detail-value">{selectedProduct.platform}</span>
                  </div>
                )}
                {selectedProduct.launcher && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Launcher</span>
                    <span className="order-detail-value">{selectedProduct.launcher}</span>
                  </div>
                )}
                {selectedProduct.deliveryTime && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Delivery Time</span>
                    <span className="order-detail-value order-detail-accent">{selectedProduct.deliveryTime}</span>
                  </div>
                )}
                {selectedProduct.warrantyDays > 0 && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Warranty</span>
                    <span className="order-detail-value">{selectedProduct.warrantyDays}-day anti-ban</span>
                  </div>
                )}
                {selectedProduct.fulfillmentMethod && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Fulfillment</span>
                    <span className="order-detail-value">
                      {selectedProduct.fulfillmentMethod === 'account_login' ? 'Account Login' :
                       selectedProduct.fulfillmentMethod === 'session_invite' ? 'Session Invite' :
                       selectedProduct.fulfillmentMethod === 'instant_delivery' ? 'Instant Delivery' :
                       selectedProduct.fulfillmentMethod === 'account_transfer' ? 'Account Transfer' :
                       selectedProduct.fulfillmentMethod}
                    </span>
                  </div>
                )}
                {selectedProduct.supportedRegions && (
                  <div className="order-detail-item">
                    <span className="order-detail-label">Regions</span>
                    <span className="order-detail-value">{selectedProduct.supportedRegions}</span>
                  </div>
                )}
              </div>
              {selectedProduct.requirements && (
                <div className="order-detail-notice order-detail-req">
                  <span>📋</span> {selectedProduct.requirements}
                </div>
              )}
              {selectedProduct.importantNotes && (
                <div className="order-detail-notice order-detail-warn">
                  <span>⚠️</span> {selectedProduct.importantNotes}
                </div>
              )}
            </div>
          )}

          <fieldset className="launcher-fieldset">
            <legend>Platform Selection</legend>
            <div className="platform-selector">
              <span className="selector-label">Platform:</span>
              {currentPlatforms.map((platform) => (
                <label className="platform-option" key={platform}>
                  <input
                    type="radio"
                    name="platformType"
                    value={platform}
                    checked={form.platformType === platform}
                    onChange={(e) => setForm({ ...form, platformType: e.target.value, launcher: currentLaunchers[0] })}
                  />
                  <span>{platform}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {form.platformType === 'PC' && (
            <fieldset className="launcher-fieldset">
              <legend>Your game launcher</legend>
              <div className="launcher-options">
                {currentLaunchers.map((launcher) => {
                  const status = LAUNCHER_STATUSES[launcher] || 'active';
                  const isInactive = status === 'inactive';
                  const isActive = form.launcher === launcher;
                  const launcherIcon = LAUNCHER_ICONS[launcher] || '🎮';
                  return (
                    <label className={`launcher-option${isActive ? ' active' : ''}${isInactive ? ' inactive' : ''}`} key={launcher}>
                      <input
                        type="radio"
                        name="launcher"
                        value={launcher}
                        checked={isActive}
                        disabled={isInactive}
                        onChange={(e) => setForm({ ...form, launcher: e.target.value, launcherId: '' })}
                      />
                      <span className="launcher-icon">{launcherIcon}</span>
                      <span className="launcher-name">{launcher}</span>
                      <span className={`launcher-status${isInactive ? ' inactive' : ''}`} title={isInactive ? 'Coming Soon' : 'Active'}></span>
                      {isInactive && (
                        <button type="button" className="waitlist-btn" onClick={(e) => {
                          e.preventDefault();
                          alert(`Join waitlist for ${launcher}`);
                        }}>
                          🔔 Join Waitlist
                        </button>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <label>
            Platform-specific ID
            <div className="launcher-id-input">
              {form.platformType === 'PC' && form.launcher && (
                <input
                  value={form.launcherId || ''}
                  onChange={(e) => setForm({ ...form, launcherId: e.target.value })}
                  placeholder={`${form.launcher} ID`}
                />
              )}
              {form.platformType === 'PS5' && (
                <input
                  value={form.psnId || ''}
                  onChange={(e) => setForm({ ...form, psnId: e.target.value })}
                  placeholder="PSN ID or Email"
                />
              )}
              {form.platformType === 'Xbox' && (
                <input
                  value={form.xboxLiveId || ''}
                  onChange={(e) => setForm({ ...form, xboxLiveId: e.target.value })}
                  placeholder="Xbox Live ID or Email"
                />
              )}
            </div>
          </label>

          <label>
            Account ID (email / username)
            <input value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} placeholder="ID or email used to sign in" />
          </label>

          <label>
            Account password
            <input type="password" value={form.accountPassword} onChange={(e) => setForm({ ...form, accountPassword: e.target.value })} placeholder="Password for the account" autoComplete="new-password" />
          </label>

          <p className="security-note">
            Credentials are encrypted before they ever reach the database, and are only
            revealed after payment to deliver your order. Learn more on our{' '}
            <a href="/safety" className="inline-link">safety &amp; privacy page</a>.
          </p>

          <label>
            Discord username (for updates)
            <input value={form.discordUsername || ''} onChange={(e) => setForm({ ...form, discordUsername: e.target.value })} placeholder="Your Discord username" />
          </label>

          <label>
            Additional info
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Preferred delivery time or extra requirements" />
          </label>

          <label>
            Promo code (optional)
            <input value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} placeholder="Enter a promo code" />
          </label>

          <div className="terms-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span className="checkbox-text">
                I agree to the <a href="/terms" className="inline-link">Terms of Service</a> &amp; <a href="/warranty" className="inline-link">30-Day Anti-Ban Warranty Policy</a>. I agree to inspect my account and report any order discrepancies within 24 hours to keep my warranty valid.
              </span>
            </label>
          </div>

          <button type="submit" className="primary-btn full" disabled={orderBusy || !buyer || !termsAccepted}>
            {!buyer ? 'Sign in required' : orderBusy ? 'Processing...' : !termsAccepted ? 'Accept terms to continue' : 'Pay via Razorpay'}
          </button>
          {orderStatus ? <p className="status-text">{orderStatus}</p> : null}
        </form>
      </div>
    </main>
  );
}

const SERVICE_BADGES = {
  no_login: { label: 'NO LOGIN NEEDED', icon: '🛡️', color: '#10B981', description: 'Only Gamertag needed to join session' },
  login_required: { label: 'LOGIN REQUIRED', icon: '🔑', color: '#F59E0B', description: 'Temporary credentials required for direct injection' },
};
