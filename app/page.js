'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import SupportChatbot from '@/components/SupportChatbot';
import ClientOnly from '@/components/ClientOnly';

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
  const [stats, setStats] = useState({ ordersCompleted: 2400, repeatBuyers: 98, averageRating: '4.8' });
  const [reviews, setReviews] = useState([]);
  const [reviewStatus, setReviewStatus] = useState('');
  const [buyer, setBuyer] = useState(null);
  const [authStatus, setAuthStatus] = useState('');
  const [games, setGames] = useState(GAMES_CONFIG);
  const [waitlistModal, setWaitlistModal] = useState({ open: false, gameId: '', launcherName: '' });
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistDiscord, setWaitlistDiscord] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('');
  const [activePlatform, setActivePlatform] = useState('all');
  const [activeLauncher, setActiveLauncher] = useState('all');
  const [productServices, setProductServices] = useState({});

  const ALL_PLATFORMS = ['all', 'PC', 'PlayStation', 'Xbox', 'Nintendo Switch'];
  const LAUNCHERS_FOR_PLATFORM = {
    PC: ['all', 'Steam', 'Epic Games', 'Rockstar Launcher', 'Riot Client', 'Xbox App'],
  };

  const categories = useMemo(() => {
    const seen = new Set(featuredAccounts.map((account) => account.category).filter(Boolean));
    return ['All', ...seen];
  }, [featuredAccounts]);

  const availableGames = useMemo(() => {
    if (activePlatform === 'all') return games;
    return games.filter((g) => {
      if (g.id === 'all') return true;
      const gamePlatforms = PLATFORMS_BY_GAME[g.id] || [];
      return gamePlatforms.includes(activePlatform);
    });
  }, [games, activePlatform]);

  const visibleAccounts = useMemo(() => {
    let filtered = featuredAccounts;

    if (activeGame !== 'all') {
      filtered = filtered.filter((a) => a.gameId === activeGame);
    }

    if (activePlatform !== 'all') {
      const platformGames = Object.entries(PLATFORMS_BY_GAME)
        .filter(([, platforms]) => platforms.includes(activePlatform))
        .map(([gameId]) => gameId);
      filtered = filtered.filter((a) => platformGames.includes(a.gameId));
    }

    if (activePlatform === 'PC' && activeLauncher !== 'all') {
      const launcherGames = Object.entries(LAUNCHERS_BY_GAME)
        .filter(([, launchers]) => launchers.includes(activeLauncher))
        .map(([gameId]) => gameId);
      filtered = filtered.filter((a) => launcherGames.includes(a.gameId));
    }

    if (activeCategory !== 'All') {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }

    return filtered;
  }, [featuredAccounts, activeGame, activePlatform, activeLauncher, activeCategory]);

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
    const gameName = GAMES_CONFIG.find(g => g.id === gameId)?.name || 'Custom Order';
    const gameServices = SERVICE_TYPES[gameId] || SERVICE_TYPES.other;
    const selectedService = productServices[account.id] || gameServices[0]?.id || 'account_recovery';
    const params = new URLSearchParams({ game: gameId, service: selectedService, name: gameName });
    if (activePlatform !== 'all') params.set('platform', activePlatform);
    if (activePlatform === 'PC' && activeLauncher !== 'all') params.set('launcher', activeLauncher);
    if (buyer) {
      window.location.href = `/order?${params.toString()}`;
    } else {
      window.location.href = `/signin?redirect=${encodeURIComponent(`/order?${params.toString()}`)}`;
    }
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
          <a href={buyer ? '/order' : '/signin?redirect=%2Forder'}>Order</a>
          <a href="#reviews">Reviews</a>
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
              <a className="ghost-btn small" href="/signin">Sign In</a>
              <a className="primary-btn small" href="/signup">Sign Up</a>
            </div>
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
            <a href={buyer ? '/order' : '/signin?redirect=%2Forder'} className="secondary-btn">Place an order</a>
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
        <ClientOnly fallback={
          <>
            <div className="game-selector" role="tablist" aria-label="Select game">
              {games.map((game) => (
                <div key={game.id} className="game-chip" style={{ height: 40, width: 100 }} />
              ))}
            </div>
            <div className="filter-row" role="tablist" aria-label="Filter catalog">
              <div className="filter-chip" style={{ height: 32, width: 60 }} />
            </div>
          </>
        }>
        <div className="platform-filter" role="tablist" aria-label="Select platform">
          {ALL_PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              className={`filter-chip${activePlatform === platform ? ' active' : ''}`}
              onClick={() => { setActivePlatform(platform); setActiveLauncher('all'); setActiveGame('all'); }}
            >
              {platform === 'all' ? '🖥️ All Platforms' : platform === 'PC' ? '🖥️ PC' : platform === 'PlayStation' ? '🎮 PlayStation' : platform === 'Xbox' ? '🟢 Xbox' : '🟡 ' + platform}
            </button>
          ))}
        </div>

        {activePlatform === 'PC' && (
          <div className="launcher-filter" role="tablist" aria-label="Select launcher">
            {LAUNCHERS_FOR_PLATFORM.PC.map((launcher) => (
              <button
                key={launcher}
                type="button"
                className={`filter-chip small${activeLauncher === launcher ? ' active' : ''}`}
                onClick={() => setActiveLauncher(launcher)}
              >
                {launcher === 'all' ? 'All Launchers' : launcher}
              </button>
            ))}
          </div>
        )}

        <div className="game-selector" role="tablist" aria-label="Select game">
          {availableGames.map((game) => (
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
        </ClientOnly>
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
                  <div className="product-service-select">
                    <select
                      value={productServices[account.id] || (SERVICE_TYPES[account.gameId] || SERVICE_TYPES.other)[0]?.id}
                      onChange={(e) => setProductServices(prev => ({ ...prev, [account.id]: e.target.value }))}
                    >
                      {(SERVICE_TYPES[account.gameId] || SERVICE_TYPES.other).map((st) => (
                        <option key={st.id} value={st.id}>{st.label}</option>
                      ))}
                    </select>
                  </div>
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
            <a href={buyer ? '/order?game=gta5&service=account_recovery&name=GTA+V' : '/signin?redirect=%2Forder%3Fgame%3Dgta5%26service%3Daccount_recovery%26name%3DGTA%2BV'} className="primary-btn block">Buy Now</a>
          </div>
          <div className="combo-card">
            <div className="combo-badge">SAVE 20%</div>
            <h3>Valorant Rank Bundle</h3>
            <p className="combo-desc">Iron to Gold + All Agents Unlocked</p>
            <div className="combo-price">
              <span className="combo-original">₹3,999</span>
              <span className="combo-final">₹2,999</span>
            </div>
            <a href={buyer ? '/order?game=valorant&service=boosting&name=Valorant' : '/signin?redirect=%2Forder%3Fgame%3Dvalorant%26service%3Dboosting%26name%3DValorant'} className="primary-btn block">Buy Now</a>
          </div>
          <div className="combo-card">
            <div className="combo-badge">SAVE 15%</div>
            <h3>Fortnite Ultimate Pack</h3>
            <p className="combo-desc">5000 V-Bucks + Level 100 Battle Pass</p>
            <div className="combo-price">
              <span className="combo-original">₹5,499</span>
              <span className="combo-final">₹4,499</span>
            </div>
            <a href={buyer ? '/order?game=fortnite&service=premade_account&name=Fortnite' : '/signin?redirect=%2Forder%3Fgame%3Dfortnite%26service%3Dpremade_account%26name%3DFortnite'} className="primary-btn block">Buy Now</a>
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
            <h3>Sign in and choose</h3>
            <p>Create an account or sign in, then pick your game and the service you need.</p>
          </div>
          <div className="step-card">
            <span className="step-number">2</span>
            <h3>Select your service type</h3>
            <p>Choose from account recovery, in-game carry, boosting, or premade accounts — each has different requirements.</p>
          </div>
          <div className="step-card">
            <span className="step-number">3</span>
            <h3>Provide what&apos;s needed</h3>
            <p>Some services only need your gamertag. Others require login details — we&apos;ll tell you upfront what&apos;s required.</p>
          </div>
          <div className="step-card">
            <span className="step-number">4</span>
            <h3>Pay and relax</h3>
            <p>Check out safely with Razorpay. We handle the rest and notify you when it&apos;s done.</p>
          </div>
        </div>

        <div className="trust-band" aria-label="Our guarantees">
          <div><span>✓</span><p><strong>Money-back promise</strong>If your order isn&apos;t delivered, we make it right.</p></div>
          <div><span>✓</span><p><strong>Discreet service</strong>No public posts, no tagging — just the order.</p></div>
          <div><span>✓</span><p><strong>Secure payments</strong>All checkout handled by Razorpay.</p></div>
          <div><span>✓</span><p><strong>Real support</strong>Reach us any time before or after your order.</p></div>
        </div>
      </section>

      <section id="reviews" className="review-card">
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

        <ClientOnly fallback={<div className="review-form" style={{ minHeight: 200 }} />}>
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
        </ClientOnly>
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
