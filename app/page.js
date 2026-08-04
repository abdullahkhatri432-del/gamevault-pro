'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import SupportChatbot from '@/components/SupportChatbot';

const SERVICE_BADGES = {
  no_login: { label: 'NO LOGIN NEEDED', icon: '🛡️', color: '#10B981', description: 'Only Gamertag needed to join session' },
  login_required: { label: 'LOGIN REQUIRED', icon: '🔑', color: '#F59E0B', description: 'Temporary credentials required for direct injection' },
  instant_delivery: { label: 'INSTANT DELIVERY', icon: '⚡', color: '#8B5CF6', description: 'Credentials delivered post-payment automatically' },
};

const LAUNCHER_STATUSES = {
  Steam: 'active', 'Epic Games': 'inactive', 'Rockstar Launcher': 'inactive', 'Riot Client': 'active',
  'Xbox App': 'active', Other: 'active',
};

const GAMES_CONFIG = [
  { id: 'all', name: 'All Games', icon: '🎮', color: '#8B5CF6' },
  { id: 'gta5', name: 'GTA V', icon: '🚗', color: '#F59E0B' },
  { id: 'valorant', name: 'Valorant', icon: '🔫', color: '#EF4444' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️', color: '#8B5CF6' },
  { id: 'forza', name: 'Forza Horizon', icon: '🏎️', color: '#06B6D4' },
  { id: 'other', name: 'Other Games', icon: '🎮', color: '#6B7280' },
];

const SERVICE_TYPES = {
  gta5: [
    { id: 'account_recovery', label: 'Account Recovery', description: 'We log in and deliver services on your account' },
    { id: 'lobby_carry', label: 'In-Game Lobby / Carry', description: 'Join a hosted session for money or RP gains' },
    { id: 'premade_account', label: 'Premade Account', description: 'Receive a ready-to-play account with progress' },
  ],
  valorant: [
    { id: 'account_recovery', label: 'Account Recovery', description: 'We log in and rank up your account' },
    { id: 'boosting', label: 'Rank Boosting', description: 'We play on your account to reach target rank' },
    { id: 'premade_account', label: 'Premade Account', description: 'Receive an account with desired rank and skins' },
  ],
  fortnite: [
    { id: 'account_recovery', label: 'Account Recovery', description: 'We log in and complete challenges on your account' },
    { id: 'lobby_carry', label: 'Carry / Lobby', description: 'Squad carry for wins and XP' },
    { id: 'premade_account', label: 'Premade Account', description: 'Receive an account with skins and V-Bucks' },
  ],
  forza: [
    { id: 'account_recovery', label: 'Account Recovery', description: 'We log in and unlock cars and credits' },
    { id: 'lobby_carry', label: 'Session Service', description: 'Join a session for credits and car delivery' },
    { id: 'premade_account', label: 'Premade Account', description: 'Receive an account with garage and credits' },
  ],
  other: [
    { id: 'account_recovery', label: 'Account Recovery', description: 'We log in and deliver services on your account' },
    { id: 'boosting', label: 'Boosting', description: 'We play on your account to achieve goals' },
    { id: 'premade_account', label: 'Premade Account', description: 'Receive a ready-to-play account' },
  ],
};

const LAUNCHERS_BY_GAME = {
  gta5: ['Steam', 'Epic Games', 'Rockstar Launcher', 'Other'],
  valorant: ['Riot Client'],
  fortnite: ['Epic Games'],
  forza: ['Xbox App', 'Steam'],
  other: ['Steam', 'Epic Games', 'Other'],
};

const PLATFORMS_BY_GAME = {
  gta5: ['PC', 'PlayStation', 'Xbox'],
  valorant: ['PC'],
  fortnite: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
  forza: ['PC', 'Xbox'],
  other: ['PC', 'PlayStation', 'Xbox'],
};

const initialFeaturedAccounts = [];
const initialReviews = [];

export default function HomePage() {
  const [featuredAccounts, setFeaturedAccounts] = useState(initialFeaturedAccounts);
  const [activeGame, setActiveGame] = useState('all');
  const [activeCategory, setActiveCategory] = useState('All');
  const [form, setForm] = useState({
    game: '',
    gameId: 'gta5',
    launcher: 'Steam',
    launcherId: '',
    platformType: 'PC',
    serviceType: 'account_recovery',
    psnId: '',
    xboxLiveId: '',
    epicId: '',
    socialClubId: '',
    accountId: '',
    accountPassword: '',
    note: '',
    couponCode: '',
    discordUsername: '',
  });
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState({ ordersCompleted: 2400, repeatBuyers: 98, averageRating: '4.8' });
  const [orderStatus, setOrderStatus] = useState('');
  const [orderBusy, setOrderBusy] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [buyer, setBuyer] = useState(null);
  const [authStatus, setAuthStatus] = useState('');
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [games, setGames] = useState(GAMES_CONFIG);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [waitlistModal, setWaitlistModal] = useState({ open: false, gameId: '', launcherName: '' });
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistDiscord, setWaitlistDiscord] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('');
  const orderSectionRef = useRef(null);

  const categories = useMemo(() => {
    const seen = new Set(featuredAccounts.map((account) => account.category).filter(Boolean));
    return ['All', ...seen];
  }, [featuredAccounts]);

  const visibleAccounts = useMemo(() => {
    if (activeCategory === 'All') {
      return featuredAccounts;
    }
    return featuredAccounts.filter((account) => account.category === activeCategory);
  }, [featuredAccounts, activeCategory]);

  const refreshStore = async (gameId = null) => {
    const url = gameId && gameId !== 'all' ? `/api/store?gameId=${gameId}` : '/api/store';
    const response = await fetch(url);
    if (!response.ok) {
      return;
    }
    const store = await response.json();
    setFeaturedAccounts(store.featuredAccounts);
    setReviews(store.reviews);
    setStats(store.stats);
  };

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

  useEffect(() => {
    refreshStore();
    refreshBuyerSession();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'failed') {
      setAuthStatus('Google sign-in did not complete. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
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

  useEffect(() => {
    refreshStore(activeGame);
    setActiveCategory('All');
  }, [activeGame]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return stats.averageRating;
    }
    const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews, stats.averageRating]);

  const selectAccount = (account) => {
    const gameId = account.gameId || 'gta5';
    const gameConfig = GAMES_CONFIG.find((g) => g.id === gameId);
    setForm((current) => ({
      ...current,
      game: account.title,
      gameId,
      serviceType: 'account_recovery',
      launcher: LAUNCHERS_BY_GAME[gameId]?.[0] || 'Steam',
      platformType: PLATFORMS_BY_GAME[gameId]?.[0] || 'PC',
    }));
    orderSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGameChange = (gameId) => {
    setActiveGame(gameId);
    if (gameId !== 'all') {
      setForm((current) => ({
        ...current,
        gameId,
        launcher: LAUNCHERS_BY_GAME[gameId]?.[0] || 'Steam',
        platformType: PLATFORMS_BY_GAME[gameId]?.[0] || 'PC',
        serviceType: 'account_recovery',
      }));
    }
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();

    if (!buyer) {
      setOrderStatus('Please sign in with Google to place an order.');
      return;
    }

    if (!form.game.trim() || !form.launcher) {
      setOrderStatus('Please select an offer and your launcher.');
      return;
    }

    setOrderBusy(true);
    setOrderStatus('Saving your order and preparing secure checkout...');

    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
        description: `Payment for ${form.game}`,
        order_id: paymentResult.id,
        prefill: {
          name: form.name,
          email: form.email,
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

          setOrderStatus('Payment verified successfully. Your order is confirmed and queued for delivery.');
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
      setForm({
        game: featuredAccounts[0]?.title || '',
        gameId: featuredAccounts[0]?.gameId || 'gta5',
        launcher: LAUNCHERS_BY_GAME[featuredAccounts[0]?.gameId || 'gta5']?.[0] || 'Steam',
        launcherId: '',
        accountId: '',
        accountPassword: '',
        note: '',
        couponCode: '',
        serviceType: 'account_recovery',
      });
      razorpay.open();
    } finally {
      setOrderBusy(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: event.target.name.value,
        comment: event.target.comment.value,
        rating: event.target.rating.value,
      }),
    });

    if (response.ok) {
      setReviewStatus('Review submitted. Thanks for your feedback!');
      event.target.reset();
      await refreshStore();
    } else {
      const result = await response.json();
      setReviewStatus(result.message || 'Unable to submit the review right now.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setBuyer(null);
    setOrderStatus('');
  };

  const currentGameConfig = GAMES_CONFIG.find((g) => g.id === form.gameId) || GAMES_CONFIG[0];
  const currentLaunchers = LAUNCHERS_BY_GAME[form.gameId] || LAUNCHERS_BY_GAME.other;
  const currentPlatforms = PLATFORMS_BY_GAME[form.gameId] || PLATFORMS_BY_GAME.other;
  const currentServiceTypes = SERVICE_TYPES[form.gameId] || SERVICE_TYPES.other;

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top">GameVault <span>Pro</span></a>
        <nav className="site-nav">
          <a href="#catalog">Catalog</a>
          <a href="#order">Order</a>
          <a href="#reviews">Reviews</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/admin">Admin</a>
        </nav>
        <div className="account-widget">
          {buyer ? (
            <div className="account-widget-inner">
              <span>Hi, {buyer.name}</span>
              <a className="ghost-btn small" href="/dashboard">Dashboard</a>
              <button type="button" className="ghost-btn small" onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <a className="google-signin-btn" href="/api/auth/google">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </a>
          )}
        </div>
      </header>

      <section className="price-match-banner">
        <div className="price-match-content">
          <span className="price-match-icon">💰</span>
          <span className="price-match-text"><strong>Price Match Guarantee:</strong> Found it cheaper? We beat any competitor&apos;s price by 10%!</span>
        </div>
      </section>

      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Multi-game services marketplace</span>
          <h1>Get premium gaming services delivered fast.</h1>
          <p>
            From GTA V money drops to Valorant rank boosts — pick your game, choose a service,
            and let our team handle the rest. Your credentials stay encrypted and secure.
          </p>
          <div className="hero-actions">
            <a href="#catalog" className="primary-btn">Browse offers</a>
            <a href="#order" className="secondary-btn">Place an order</a>
            <a href="#how-it-works" className="ghost-btn">How it works</a>
          </div>
          <div className="trust-badges" aria-label="Trust and safety">
            <span>🛡️ 100% Undetected & Safe PC Methods</span>
            <span>✅ 30-Day Anti-Ban Warranty</span>
            <span>💰 Cheapest Price Guarantee (Match + 10% Off)</span>
            <span>⚡ Instant Live Support</span>
          </div>
          <div className="stats-grid">
            <div>
              <strong>{stats.ordersCompleted.toLocaleString()}+</strong>
              <span>Orders completed</span>
            </div>
            <div>
              <strong>{stats.repeatBuyers}%</strong>
              <span>Repeat buyers</span>
            </div>
            <div>
              <strong>{averageRating}</strong>
              <span>Average rating</span>
            </div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="glass-card">
            <p>Live marketplace pulse</p>
            <h3>Top selling offers</h3>
            <div className="mini-list">
              <div><span>GTA V money drops</span><strong>+38%</strong></div>
              <div><span>Valorant rank boosts</span><strong>+27%</strong></div>
              <div><span>Fortnite V-Bucks</span><strong>+19%</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="catalog-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Browse by game</span>
            <h2>Marketplace catalog</h2>
          </div>
        </div>
        <div className="game-selector" role="tablist" aria-label="Select game">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              className={`game-chip${activeGame === game.id ? ' active' : ''}`}
              style={activeGame === game.id ? { borderColor: game.color, backgroundColor: `${game.color}20` } : {}}
              onClick={() => handleGameChange(game.id)}
            >
              <span className="game-icon">{game.icon}</span>
              <span>{game.name}</span>
            </button>
          ))}
        </div>
        <div className="filter-row" role="tablist" aria-label="Filter catalog">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-chip${activeCategory === category ? ' active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="card-grid">
          {visibleAccounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No offers found</h3>
              <p>No offers available for this selection. Try a different game or category.</p>
            </div>
          ) : (
            visibleAccounts.map((account) => {
              const gameConfig = GAMES_CONFIG.find((g) => g.id === account.gameId) || GAMES_CONFIG[0];
              const isPopular = account.title.includes('100M') || account.title.includes('Booster Pack') || account.title.includes('1-120');
              const deliveryEta =
                account.category === 'In-game currency' || account.category === 'V-Bucks' || account.category === 'Credits'
                  ? 'Delivery: 30–60 min'
                  : account.category === 'Modded cars' || account.category === 'Car unlock'
                  ? 'Delivery: same session'
                  : 'Delivery: 2–4 hrs';
              const badgeType = account.category?.includes('currency') || account.category?.includes('V-Bucks') || account.category?.includes('Credits')
                ? 'no_login'
                : account.category?.includes('Modded accounts') || account.category?.includes('Premade accounts')
                ? 'instant_delivery'
                : 'login_required';
              const badge = SERVICE_BADGES[badgeType];
              const launcherStatus = LAUNCHER_STATUSES[account.launcher] || 'active';

              return (
                <article className="product-card" key={account.id ?? account.title}>
                  {isPopular ? <span className="popular-ribbon">Most popular</span> : null}
                  <div className="product-game-badge" style={{ backgroundColor: `${gameConfig.color}20`, color: gameConfig.color }}>
                    {gameConfig.icon} {gameConfig.name}
                  </div>
                  {badge && (
                    <div className="service-badge" style={{ backgroundColor: badge.color + '20', color: badge.color, border: `1px solid ${badge.color}50` }}>
                      {badge.icon} [{badge.label}]
                    </div>
                  )}
                  {account.imageUrl ? (
                    <img className="product-image" src={account.imageUrl} alt={account.title} />
                  ) : null}
                  <div className="product-badge">{account.tag}</div>
                  <h3>{account.title}</h3>
                  {account.category ? <p className="product-category">{account.category}</p> : null}
                  {account.description ? <p className="product-description">{account.description}</p> : null}
                  <div className="product-meta">
                    <span>{account.rating} ★</span>
                    <span>{account.stock}</span>
                  </div>
                  <div className="product-guarantees">
                    <span>{deliveryEta}</span>
                    <span>✓ Guaranteed</span>
                  </div>
                  <div className="price-row">
                    <strong>{account.price}</strong>
                    <button className="primary-btn small" type="button" onClick={() => selectAccount(account)}>Buy now</button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section id="combo-packs" className="combo-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Best value bundles</span>
            <h2>Combo Packs</h2>
          </div>
        </div>
        <div className="combo-grid">
          <div className="combo-card">
            <div className="combo-badge">SAVE 25%</div>
            <h3>GTA V PC Starter Pack</h3>
            <p className="combo-desc">$100M Cash + Level 120 + All Unlocks</p>
            <div className="combo-price">
              <span className="combo-original">₹18,999</span>
              <span className="combo-final">₹12,999</span>
            </div>
            <button className="primary-btn" onClick={() => { selectAccount({ title: 'GTA 5 100M + Level 120 + All Unlocks', gameId: 'gta5', category: 'Custom services' }); }}>
              Buy Now
            </button>
          </div>
          <div className="combo-card">
            <div className="combo-badge">SAVE 20%</div>
            <h3>Valorant Rank Bundle</h3>
            <p className="combo-desc">Iron to Gold + All Agents Unlocked</p>
            <div className="combo-price">
              <span className="combo-original">₹3,999</span>
              <span className="combo-final">₹2,999</span>
            </div>
            <button className="primary-btn" onClick={() => { selectAccount({ title: 'Valorant Iron to Gold Boost', gameId: 'valorant', category: 'Rank boost' }); }}>
              Buy Now
            </button>
          </div>
          <div className="combo-card">
            <div className="combo-badge">SAVE 15%</div>
            <h3>Fortnite Ultimate Pack</h3>
            <p className="combo-desc">5000 V-Bucks + Level 100 Battle Pass</p>
            <div className="combo-price">
              <span className="combo-original">₹5,499</span>
              <span className="combo-final">₹4,499</span>
            </div>
            <button className="primary-btn" onClick={() => { selectAccount({ title: 'Fortnite V-Bucks 5000', gameId: 'fortnite', category: 'V-Bucks' }); }}>
              Buy Now
            </button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Simple by design</span>
            <h2>How it works</h2>
          </div>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">1</span>
            <h3>Sign in with Google</h3>
            <p>One quick sign-in so we know who is ordering and where to send updates.</p>
          </div>
          <div className="step-card">
            <span className="step-number">2</span>
            <h3>Pick your game and offer</h3>
            <p>Choose your game, then select from money packs, rank boosts, or account services.</p>
          </div>
          <div className="step-card">
            <span className="step-number">3</span>
            <h3>Share your account securely</h3>
            <p>Tell us your launcher and account details. They are encrypted immediately and only used for delivery.</p>
          </div>
          <div className="step-card">
            <span className="step-number">4</span>
            <h3>Pay and get it done</h3>
            <p>Check out safely with Razorpay. We deliver on your account and confirm when it&apos;s complete.</p>
          </div>
        </div>

        <div className="trust-band" aria-label="Our guarantees">
          <div><span>✓</span><p><strong>Money-back promise</strong>If your order isn&apos;t delivered, we make it right.</p></div>
          <div><span>✓</span><p><strong>Discreet service</strong>No public posts, no tagging — just the order.</p></div>
          <div><span>✓</span><p><strong>Secure payments</strong>All checkout handled by Razorpay.</p></div>
          <div><span>✓</span><p><strong>Real support</strong>Reach us any time before or after your order.</p></div>
        </div>
      </section>

      <section id="order" ref={orderSectionRef} className="order-layout">
        <div className="order-card">
          <span className="eyebrow">Place an order</span>
          <h2>Request a purchase</h2>
          {authStatus ? <p className="status-text">{authStatus}</p> : null}
          {!buyer ? (
            <div className="signin-required">
              <p>You must sign in with Google before placing an order.</p>
              <a className="primary-btn" href="/api/auth/google">Sign in with Google</a>
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

            <label>
              Select game
              <select value={form.gameId} onChange={(e) => handleGameChange(e.target.value)}>
                {GAMES_CONFIG.filter((g) => g.id !== 'all').map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.icon} {game.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Service type
              <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                {currentServiceTypes.map((st) => {
                  const badge = SERVICE_BADGES[st.badge || 'login_required'];
                  return (
                    <option key={st.id} value={st.id}>
                      {badge?.icon || ''} {st.label} [{badge?.label || ''}]
                    </option>
                  );
                })}
              </select>
            </label>
            {currentServiceTypes.find((st) => st.id === form.serviceType) && (
              <div className="service-type-info" style={{ backgroundColor: SERVICE_BADGES[currentServiceTypes.find((st) => st.id === form.serviceType).badge || 'login_required']?.color + '10', border: `1px solid ${SERVICE_BADGES[currentServiceTypes.find((st) => st.id === form.serviceType).badge || 'login_required']?.color}30`, borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <p style={{ color: SERVICE_BADGES[currentServiceTypes.find((st) => st.id === form.serviceType).badge || 'login_required']?.color, fontSize: '14px' }}>
                  {SERVICE_BADGES[currentServiceTypes.find((st) => st.id === form.serviceType).badge || 'login_required']?.icon}{' '}
                  {SERVICE_BADGES[currentServiceTypes.find((st) => st.id === form.serviceType).badge || 'login_required']?.description}
                </p>
              </div>
            )}

            <label>
              Select offer
              <select value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })}>
                <option value="">Choose an offer</option>
                {featuredAccounts
                  .filter((a) => form.gameId === 'all' || a.gameId === form.gameId)
                  .map((item) => (
                    <option key={item.id ?? item.title} value={item.title}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </label>

            <fieldset className="launcher-fieldset">
              <legend>Your game launcher</legend>
              <div className="launcher-options">
                {currentLaunchers.map((launcher) => {
                  const status = LAUNCHER_STATUSES[launcher] || 'active';
                  const isInactive = status === 'inactive';
                  return (
                    <label className={`launcher-option${isInactive ? ' inactive' : ''}`} key={launcher}>
                      <input
                        type="radio"
                        name="launcher"
                        value={launcher}
                        checked={form.launcher === launcher}
                        disabled={isInactive}
                        onChange={(e) => setForm({ ...form, launcher: e.target.value, launcherId: '' })}
                      />
                      <span>{launcher}</span>
                      {isInactive && (
                        <button
                          type="button"
                          className="waitlist-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            setWaitlistModal({ open: true, gameId: form.gameId, launcherName: launcher });
                          }}
                        >
                          🔔 Join Waitlist
                        </button>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

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
                      onChange={(e) => setForm({ ...form, platformType: e.target.value, launcher: currentLaunchers[0], launcherId: '', psnId: '', xboxLiveId: '', epicId: '', socialClubId: '' })}
                    />
                    <span>{platform}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label>
              Platform-specific ID
              <div className="launcher-id-input">
                {form.platformType === 'PC' && currentLaunchers.map((launcher) => (
                  launcher === form.launcher && (
                    <input
                      key={launcher}
                      value={form.launcherId || ''}
                      onChange={(e) => setForm({ ...form, launcherId: e.target.value })}
                      placeholder={`${launcher} ID`}
                    />
                  )
                ))}
                {form.platformType === 'PlayStation' && (
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
                {!form.platformType && (
                  <div className="launcher-id-placeholder">
                    <span>Select a platform first</span>
                  </div>
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
            <ul className="order-promises">
              <li>No account changes beyond what your offer requires.</li>
              <li>Password is never stored in plain text.</li>
              <li>Use a temporary password if you prefer — we only need it once.</li>
            </ul>

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
                  I agree to the <a href="/terms" className="inline-link">Terms of Service</a> & <a href="/warranty" className="inline-link">30-Day Anti-Ban Warranty Policy</a>. I agree to inspect my account and report any order discrepancies within 24 hours to keep my warranty valid.
                </span>
              </label>
            </div>

            <button type="submit" className="primary-btn full" disabled={orderBusy || !buyer || !termsAccepted}>
              {!buyer ? 'Sign in to order' : orderBusy ? 'Processing...' : !termsAccepted ? 'Accept terms to continue' : 'Pay via Razorpay'}
            </button>
            {orderStatus ? <p className="status-text">{orderStatus}</p> : null}
          </form>
        </div>

        <div id="reviews" className="review-card">
          <span className="eyebrow">Customer reviews</span>
          <h2>What buyers say</h2>
          <div className="review-list">
            {reviews.map((review, index) => (
              <article className="review-item" key={`${review.name}-${index}`}>
                <div className="review-head">
                  <strong>{review.name}</strong>
                  <span>{review.rating} ★</span>
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>

          <form className="review-form" onSubmit={handleReviewSubmit}>
            <label>
              Name
              <input name="name" placeholder="Your name" />
            </label>
            <label>
              Rating
              <select name="rating">
                <option value="5.0">5.0</option>
                <option value="4.5">4.5</option>
                <option value="4.0">4.0</option>
                <option value="3.5">3.5</option>
                <option value="3.0">3.0</option>
              </select>
            </label>
            <label>
              Review
              <textarea name="comment" placeholder="Share your experience" />
            </label>
            <button type="submit" className="secondary-btn full">Submit review</button>
            {reviewStatus ? <p className="status-text">{reviewStatus}</p> : null}
          </form>
        </div>
      </section>

      <section id="faq" className="faq-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Good to know</span>
            <h2>Frequently asked questions</h2>
          </div>
        </div>
        <div className="faq-list">
          <details className="faq-item">
            <summary>Is it safe to share my game account?</summary>
            <p>
              Your details are encrypted with strong encryption the moment you submit them and are
              only used to complete your delivery. We never share, sell, or reuse them. You can also
              use a temporary password and change it after delivery.
            </p>
          </details>
          <details className="faq-item">
            <summary>How fast will I receive my order?</summary>
            <p>
              Currency and credit drops are typically delivered within 30–60 minutes, level boosts within 2–4 hours,
              and account services in the same session. Busy periods can take a little longer — you&apos;ll always
              get a status update.
            </p>
          </details>
          <details className="faq-item">
            <summary>How do I pay?</summary>
            <p>
              Payments go through Razorpay, so your card or UPI details never touch our servers. You&apos;ll
              see the exact amount before you confirm, including any promo code discount.
            </p>
          </details>
          <details className="faq-item">
            <summary>What if something goes wrong with my order?</summary>
            <p>
              We stand behind every order. If your purchase isn&apos;t delivered or the service isn&apos;t
              completed, reach out and we&apos;ll fix it or refund you — no hard feelings.
            </p>
          </details>
          <details className="faq-item">
            <summary>Can I use a promo code?</summary>
            <p>
              Yes. Enter your code in the promo field at checkout. If it&apos;s valid, the discount is
              applied to your total before you pay.
            </p>
          </details>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-links">
          <a href="#catalog">Offers</a>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
          <a href="/safety">Safety &amp; privacy</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/boosters">Become a Booster</a>
          <a href="/admin">Admin</a>
        </div>
        <p>GameVault Pro — premium gaming services marketplace. Pay safely with Razorpay.</p>
      </footer>

      {waitlistModal.open && (
        <div className="modal-overlay" onClick={() => setWaitlistModal({ open: false, gameId: '', launcherName: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Join Waitlist</h2>
            <p className="modal-description">
              {waitlistModal.launcherName} is currently undergoing anti-ban safety maintenance. Enter your details to be notified as soon as slots open.
            </p>
            <label className="block mb-4">
              <span className="text-sm text-[#9CA3AF]">Email Address</span>
              <input
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1"
                placeholder="your@email.com"
              />
            </label>
            <label className="block mb-4">
              <span className="text-sm text-[#9CA3AF]">Discord Username (optional)</span>
              <input
                value={waitlistDiscord}
                onChange={(e) => setWaitlistDiscord(e.target.value)}
                className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1"
                placeholder="username#1234"
              />
            </label>
            {waitlistStatus ? (
              <p className="text-[#10B981] text-sm mb-4">{waitlistStatus}</p>
            ) : null}
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setWaitlistModal({ open: false, gameId: '', launcherName: '' })}>Cancel</button>
              <button
                className="primary-btn"
                onClick={async () => {
                  if (!waitlistEmail) return;
                  const response = await fetch('/api/waitlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      gameId: waitlistModal.gameId,
                      launcherName: waitlistModal.launcherName,
                      email: waitlistEmail,
                      discordUsername: waitlistDiscord,
                    }),
                  });
                  if (response.ok) {
                    setWaitlistStatus('Added to waitlist! We will notify you when slots open.');
                  } else {
                    const result = await response.json();
                    setWaitlistStatus(result.message || 'Failed to join waitlist.');
                  }
                }}
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      )}

      <SupportChatbot />
    </main>
  );
}
