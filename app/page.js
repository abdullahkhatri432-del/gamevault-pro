'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const initialFeaturedAccounts = [];
const initialReviews = [];

export default function HomePage() {
  const [featuredAccounts, setFeaturedAccounts] = useState(initialFeaturedAccounts);
  const [activeCategory, setActiveCategory] = useState('All');
  const [form, setForm] = useState({
    game: '',
    launcher: 'Steam',
    launcherId: '',
    platformType: 'PC',
    psnId: '',
    xboxLiveId: '',
    epicId: '',
    socialClubId: '',
    accountId: '',
    accountPassword: '',
    note: '',
    couponCode: '',
  });
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState({ ordersCompleted: 2400, repeatBuyers: 98, averageRating: '4.8' });
  const [orderStatus, setOrderStatus] = useState('');
  const [orderBusy, setOrderBusy] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [buyer, setBuyer] = useState(null);
  const [authStatus, setAuthStatus] = useState('');
  const [razorpayReady, setRazorpayReady] = useState(false);
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

  const refreshStore = async () => {
    const response = await fetch('/api/store');
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

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return stats.averageRating;
    }
    const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews, stats.averageRating]);

  const selectAccount = (account) => {
    setForm((current) => ({ ...current, game: account.title }));
    orderSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
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

          setOrderStatus('Payment verified successfully. Your account order is confirmed and queued for delivery.');
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
        launcher: 'Steam',
        accountId: '',
        accountPassword: '',
        note: '',
        couponCode: '',
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

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top">GameVault <span>Pro</span></a>
        <nav className="site-nav">
          <a href="#catalog">Catalog</a>
          <a href="#order">Order</a>
          <a href="#reviews">Reviews</a>
          <a href="/admin">Admin</a>
        </nav>
        <div className="account-widget">
          {buyer ? (
            <div className="account-widget-inner">
              <span>Hi, {buyer.name}</span>
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

      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">GTA 5 services, done right</span>
          <h1>Get GTA 5 money, level boosts, and modded cars delivered fast.</h1>
          <p>
            Pick an offer, sign in with Google, and share your Rockstar account once.
            We handle the drop, the grind, or the setup for you — your credentials stay
            encrypted and are only used to deliver your order.
          </p>
          <div className="hero-actions">
            <a href="#catalog" className="primary-btn">Browse offers</a>
            <a href="#order" className="secondary-btn">Place an order</a>
            <a href="#how-it-works" className="ghost-btn">How it works</a>
          </div>
          <div className="trust-badges" aria-label="Trust and safety">
            <span>✓ Secure Razorpay checkout</span>
            <span>✓ Encrypted account details</span>
            <span>✓ Fast delivery</span>
            <span>✓ Support when you need it</span>
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
              <div><span>GTA 5 money drops</span><strong>+38%</strong></div>
              <div><span>Level boosters</span><strong>+21%</strong></div>
              <div><span>Account upgrades</span><strong>+17%</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="catalog-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Featured offers</span>
            <h2>Marketplace catalog</h2>
          </div>
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
          {visibleAccounts.map((account) => {
            const isPopular =
              account.title.includes('100M') || account.title.includes('Booster Pack') || account.title.includes('1-120');
            const deliveryEta =
              account.category === 'In-game currency'
                ? 'Delivery: 30–60 min'
                : account.category === 'Modded cars'
                ? 'Delivery: same session'
                : 'Delivery: 2–4 hrs';
            return (
              <article className="product-card" key={account.id ?? account.title}>
                {isPopular ? <span className="popular-ribbon">Most popular</span> : null}
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
          })}
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
            <h3>Pick your offer</h3>
            <p>Choose your money pack, level boost, modded cars, or setup. Add a promo code for extra savings.</p>
          </div>
          <div className="step-card">
            <span className="step-number">3</span>
            <h3>Share your account securely</h3>
            <p>Tell us your launcher and Rockstar sign-in details. They are encrypted immediately and only used for delivery.</p>
          </div>
          <div className="step-card">
            <span className="step-number">4</span>
            <h3>Pay and get it done</h3>
            <p>Check out safely with Razorpay. We deliver on your account and confirm when it's complete.</p>
          </div>
        </div>

        <div className="trust-band" aria-label="Our guarantees">
          <div><span>✓</span><p><strong>Money-back promise</strong>If your order isn't delivered, we make it right.</p></div>
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
              Select offer
              <select value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })}>
                <option value="">Choose an offer</option>
                {featuredAccounts.map((item) => (
                  <option key={item.id ?? item.title} value={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="launcher-fieldset">
              <legend>Your game launcher</legend>
              <div className="launcher-options">
                {['Steam', 'Epic Games', 'Rockstar Launcher', 'Other'].map((launcher) => (
                  <label className="launcher-option" key={launcher}>
                    <input
                      type="radio"
                      name="launcher"
                      value={launcher}
                      checked={form.launcher === launcher}
                      onChange={(e) => setForm({ ...form, launcher: e.target.value, launcherId: '' })}
                    />
                    <span>{launcher}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="launcher-fieldset">
              <legend>Platform Selection</legend>
              <div className="platform-selector">
                <span className="selector-label">Platform:</span>
                {['PC', 'PlayStation', 'Xbox'].map((platform) => (
                  <label className="platform-option" key={platform}>
                    <input
                      type="radio"
                      name="platformType"
                      value={platform}
                      checked={form.platformType === platform}
                      onChange={(e) => setForm({ ...form, platformType: e.target.value, launcher: '', launcherId: '', psnId: '', xboxLiveId: '', epicId: '', socialClubId: '' })}
                    />
                    <span>{platform}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label>
              Platform-specific ID
              <div className="launcher-id-input">
                {form.platformType === 'PC' && form.launcher === 'Steam' && (
                  <input
                    value={form.launcherId || ''}
                    onChange={(e) => setForm({ ...form, launcherId: e.target.value })}
                    placeholder="Steam ID (e.g., 76561198012345678)"
                  />
                )}
                {form.platformType === 'PC' && form.launcher === 'Epic Games' && (
                  <input
                    value={form.launcherId || ''}
                    onChange={(e) => setForm({ ...form, launcherId: e.target.value })}
                    placeholder="Epic Games ID"
                  />
                )}
                {form.platformType === 'PC' && form.launcher === 'Rockstar Launcher' && (
                  <input
                    value={form.launcherId || ''}
                    onChange={(e) => setForm({ ...form, launcherId: e.target.value })}
                    placeholder="Rockstar ID or Email"
                  />
                )}
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
              Account ID (Rockstar email / username)
              <input value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} placeholder="ID or email used to sign in" />
            </label>
            <label>
              Account password
              <input type="password" value={form.accountPassword} onChange={(e) => setForm({ ...form, accountPassword: e.target.value })} placeholder="Password for the account" autoComplete="new-password" />
            </label>
            <p className="security-note">
              Credentials are encrypted before they ever reach the database, and are only
              revealed after payment to deliver your order. Learn more on our{' '}
              <a href="/safety" className="inline-link">safety & privacy page</a>.
            </p>
            <ul className="order-promises">
              <li>No account changes beyond what your offer requires.</li>
              <li>Password is never stored in plain text.</li>
              <li>Use a temporary password if you prefer — we only need it once.</li>
            </ul>
            <label>
              Additional info
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Preferred delivery time or extra requirements" />
            </label>
            <label>
              Promo code (optional)
              <input value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} placeholder="Enter a promo code" />
            </label>
            <button type="submit" className="primary-btn full" disabled={orderBusy || !buyer}>
              {!buyer ? 'Sign in to order' : orderBusy ? 'Processing...' : 'Pay via Razorpay'}
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
            <summary>Is it safe to share my Rockstar account?</summary>
            <p>
              Your details are encrypted with strong encryption the moment you submit them and are
              only used to complete your delivery. We never share, sell, or reuse them. You can also
              use a temporary password and change it after delivery.
            </p>
          </details>
          <details className="faq-item">
            <summary>How fast will I receive my order?</summary>
            <p>
              Money drops are typically delivered within 30–60 minutes, level boosts within 2–4 hours,
              and modded cars in the same session. Busy periods can take a little longer — you'll always
              get a status update.
            </p>
          </details>
          <details className="faq-item">
            <summary>How do I pay?</summary>
            <p>
              Payments go through Razorpay, so your card or UPI details never touch our servers. You'll
              see the exact amount before you confirm, including any promo code discount.
            </p>
          </details>
          <details className="faq-item">
            <summary>What if something goes wrong with my order?</summary>
            <p>
              We stand behind every order. If your purchase isn't delivered or the service isn't
              completed, reach out and we'll fix it or refund you — no hard feelings.
            </p>
          </details>
          <details className="faq-item">
            <summary>Can I use a promo code?</summary>
            <p>
              Yes. Enter your code in the promo field at checkout. If it's valid, the discount is
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
          <a href="/safety">Safety & privacy</a>
          <a href="/admin">Admin</a>
        </div>
        <p>GameVault Pro — premium GTA 5 offers. Pay safely with Razorpay.</p>
      </footer>
    </main>
  );
}
