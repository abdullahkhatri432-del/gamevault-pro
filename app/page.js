'use client';

import { useEffect, useMemo, useState } from 'react';

const initialFeaturedAccounts = [
  {
    title: 'Valorant Prime',
    price: '$18',
    tag: 'Legendary skin bundle',
    rating: '4.9',
    stock: '12 left',
  },
  {
    title: 'Fortnite OG',
    price: '$12',
    tag: 'Battle pass included',
    rating: '4.8',
    stock: '8 left',
  },
  {
    title: 'EA FC Elite',
    price: '$24',
    tag: 'Top-tier club account',
    rating: '4.7',
    stock: '5 left',
  },
];

const initialReviews = [
  { name: 'Aarav', comment: 'Fast delivery and super clean account setup.', rating: '5.0' },
  { name: 'Lina', comment: 'Loved the smooth checkout and modern design.', rating: '4.9' },
  { name: 'Nico', comment: 'The order process felt secure and simple.', rating: '4.8' },
];

function getAmountFromPrice(price) {
  return Number.parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
}

export default function HomePage() {
  const [featuredAccounts, setFeaturedAccounts] = useState(initialFeaturedAccounts);
  const [form, setForm] = useState({ name: '', game: 'Valorant Prime', email: '', note: '' });
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState({ ordersCompleted: 2400, repeatBuyers: 98, averageRating: '4.8' });
  const [orderStatus, setOrderStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [buyer, setBuyer] = useState(null);
  const [buyerAuthStatus, setBuyerAuthStatus] = useState('');
  const [buyerLoginForm, setBuyerLoginForm] = useState({ email: '', password: '' });
  const [buyerRegisterForm, setBuyerRegisterForm] = useState({ name: '', email: '', password: '' });
  const [razorpayReady, setRazorpayReady] = useState(false);

  const refreshStore = async () => {
    const response = await fetch('/api/store');
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
    const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleOrderSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.game.trim()) {
      setOrderStatus('Please provide your name, email, and the account you want to purchase.');
      return;
    }

    setOrderStatus('Saving your order request and preparing Razorpay checkout...');

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const result = await response.json();
      setOrderStatus(result.message || 'Something went wrong while sending the order.');
      return;
    }

    const selectedAccount = featuredAccounts.find((account) => account.title === form.game) || featuredAccounts[0];
    const orderAmount = getAmountFromPrice(selectedAccount?.price || '$0');

    if (!orderAmount || orderAmount <= 0) {
      setOrderStatus('This account does not have a valid price for Razorpay checkout.');
      return;
    }

    const paymentResponse = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: orderAmount,
        currency: 'INR',
        receipt: `gamevault_${Date.now()}`,
        notes: {
          customerName: form.name,
          customerEmail: form.email,
          account: form.game,
        },
      }),
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

        setOrderStatus(
          verifyResult.valid
            ? 'Payment verified successfully. Your account order is confirmed.'
            : 'Checkout completed, but signature verification failed. Please contact support.'
        );
      },
      theme: {
        color: '#5eead4',
      },
      modal: {
        ondismiss: () => {
          setOrderStatus('Razorpay checkout was closed before payment completion.');
        },
      },
    });

    setOrderStatus('Order request saved. Complete Razorpay checkout to confirm your purchase.');
    setForm({ name: '', game: featuredAccounts[0]?.title || 'Valorant Prime', email: '', note: '' });
    await refreshStore();
    razorpay.open();
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

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Trusted marketplace</span>
          <h1>Sell premium game accounts with a modern storefront.</h1>
          <p>
            GameVault Pro helps you launch a sleek marketplace where customers can browse top
            account offers, place orders, and share reviews.
          </p>
          <div className="hero-actions">
            <a href="#catalog" className="primary-btn">Explore catalog</a>
            <a href="#reviews" className="secondary-btn">See reviews</a>
            <a href="/admin" className="ghost-btn">Open admin</a>
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
            <h3>Top selling game account bundles</h3>
            <div className="mini-list">
              <div><span>Valorant</span><strong>+38%</strong></div>
              <div><span>Fortnite</span><strong>+21%</strong></div>
              <div><span>EA FC</span><strong>+17%</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="catalog-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Featured offers</span>
            <h2>Marketplace bundles</h2>
          </div>
          <button className="ghost-btn">Filter</button>
        </div>
        <div className="card-grid">
          {featuredAccounts.map((account) => (
            <article className="product-card" key={account.title}>
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
              <div className="price-row">
                <strong>{account.price}</strong>
                <button className="primary-btn small">Buy now</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="order-layout">
        <div className="order-card">
          <span className="eyebrow">Place an order</span>
          <h2>Request a game account</h2>
          <form onSubmit={handleOrderSubmit} className="order-form">
            <label>
              Your name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" />
            </label>
            <label>
              Email address
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
            </label>
            <label>
              Select account
              <select value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })}>
                {featuredAccounts.map((item) => (
                  <option key={item.title} value={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Additional info
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tell us your preferred account setup or requirements" />
            </label>
            <button type="submit" className="primary-btn full">Pay via Razorpay</button>
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
                <option value="4.9">4.9</option>
                <option value="4.8">4.8</option>
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
    </main>
  );
}
