'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const GAMES_CONFIG = [
  { id: 'all', name: 'All Games', icon: '🎮', color: '#8B5CF6' },
  { id: 'gta5', name: 'GTA V', icon: '🚗', color: '#F59E0B' },
  { id: 'valorant', name: 'Valorant', icon: '🔫', color: '#EF4444' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️', color: '#8B5CF6' },
  { id: 'forza', name: 'Forza Horizon', icon: '🏎️', color: '#06B6D4' },
  { id: 'other', name: 'Other Games', icon: '🎮', color: '#6B7280' },
];

const FULFILLMENT_LABELS = {
  account_login: '🔐 Account Login — We log in to your account to deliver the service',
  session_invite: '🎮 Session Invite — Join a hosted session for delivery',
  instant_delivery: '⚡ Instant Delivery — Credentials delivered automatically after payment',
  account_transfer: '🔄 Account Transfer — Full account credentials transferred to you',
};

function StarRating({ rating }) {
  const num = Number(rating) || 0;
  return (
    <span className='sd-stars'>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(num) ? 'sd-star filled' : 'sd-star'}>★</span>
      ))}
      <span className='sd-rating-num'>{num.toFixed(1)}</span>
    </span>
  );
}

function LoadingState() {
  return (
    <div className='sd-loading'>
      <div className='sd-spinner' />
      <p>Loading service details...</p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className='sd-not-found'>
      <span className='sd-nf-icon'>🔍</span>
      <h2>Service not found</h2>
      <p>This service may have been removed or is no longer available.</p>
      <a href='/' className='sd-btn-primary'>Browse Services</a>
    </div>
  );
}

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ name: '', comment: '', rating: '5' });
  const [reviewStatus, setReviewStatus] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/store?id=${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/store').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([productData, storeData]) => {
        if (productData?.product) {
          setProduct(productData.product);
        } else {
          setError('not_found');
        }
        if (storeData?.reviews) {
          setReviews(storeData.reviews);
        }
      })
      .catch(() => setError('network'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewStatus('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        setReviewStatus('Review submitted!');
        setReviewForm({ name: '', comment: '', rating: '5' });
        setReviews((prev) => [{ name: reviewForm.name, comment: reviewForm.comment, rating: reviewForm.rating }, ...prev]);
      } else {
        const data = await res.json();
        setReviewStatus(data.message || 'Failed to submit review.');
      }
    } catch {
      setReviewStatus('Network error. Please try again.');
    }
  };

  if (loading) return <LoadingState />;
  if (error === 'not_found' || !product) return <NotFoundState />;
  if (error === 'network') return (
    <div className='sd-not-found'>
      <span className='sd-nf-icon'>⚠️</span>
      <h2>Connection error</h2>
      <p>Unable to load service details. Please try again.</p>
      <button className='sd-btn-primary' onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const gameConfig = GAMES_CONFIG.find((g) => g.id === product.gameId) || GAMES_CONFIG[0];
  const currentPrice = Number(String(product.price || '').replace(/[^0-9.]/g, '')) || 0;
  const originalPrice = Number(String(product.originalPrice || '').replace(/[^0-9.]/g, '')) || 0;
  const discountPct = originalPrice > currentPrice && currentPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  const faqs = [
    { q: 'How long does delivery take?', a: `Delivery typically takes ${product.deliveryTime || '2-4 hours'} after payment confirmation. Most orders are completed within this window.` },
    { q: 'Is my account safe?', a: 'Yes. We use professional, undetected methods and never share your account details. All credentials are encrypted and only used for the service you ordered.' },
    { q: 'What if I face issues after delivery?', a: `We offer a ${product.warrantyDays || 30}-day warranty on all services. If you encounter any issues within this period, contact our support team for immediate resolution.` },
    { q: 'What do I need to provide?', a: product.requirements || 'You will need to provide your account credentials or gamertag depending on the service type. Specific requirements are listed above.' },
    { q: 'Can I get a refund?', a: 'Refunds are available before service delivery begins. Once the service is in progress or completed, please contact support for assistance with any concerns.' },
  ];

  return (
    <div className='sd-page'>
      <section className='sd-hero'>
        {product.imageUrl ? (
          <img className='sd-hero-img' src={product.imageUrl} alt={product.title} />
        ) : (
          <div className='sd-hero-placeholder' style={{ backgroundColor: gameConfig.color + '30' }}>
            <span className='sd-hero-icon'>{gameConfig.icon}</span>
          </div>
        )}
        <div className='sd-hero-overlay'>
          <div className='sd-hero-badges'>
            <span className='sd-game-badge' style={{ backgroundColor: gameConfig.color + '30', color: gameConfig.color, borderColor: gameConfig.color + '50' }}>
              {gameConfig.icon} {gameConfig.name}
            </span>
            {product.availability && (
              <span className={'sd-availability-badge sd-avail-' + product.availability}>
                {product.availability === 'available' ? '✅ Available' : product.availability === 'limited' ? '⏳ Limited' : product.availability === 'on_request' ? '📋 On Request' : '❌ Unavailable'}
              </span>
            )}
            {product.serviceStatus === 'maintenance' && (
              <span className='sd-availability-badge sd-avail-unavailable'>🔧 Under Maintenance</span>
            )}
          </div>
          <h1 className='sd-hero-title'>{product.title}</h1>
          <div className='sd-hero-meta'>
            {product.category && <span className='sd-category'>{product.category}</span>}
            <StarRating rating={product.rating} />
            {product.tag && <span className='sd-tag'>{product.tag}</span>}
          </div>
        </div>
      </section>

      <div className='sd-layout'>
        <div className='sd-main'>
          {product.description && (
            <section className='sd-section'>
              <h2 className='sd-section-title'>About this service</h2>
              <p className='sd-description'>{product.description}</p>
            </section>
          )}

          <section className='sd-section'>
            <h2 className='sd-section-title'>Service details</h2>
            <div className='sd-details-grid'>
              {product.platform && (
                <div className='sd-detail-item'>
                  <span className='sd-detail-icon'>🖥️</span>
                  <div>
                    <span className='sd-detail-label'>Platform</span>
                    <span className='sd-detail-value'>{product.platform}</span>
                  </div>
                </div>
              )}
              {product.launcher && (
                <div className='sd-detail-item'>
                  <span className='sd-detail-icon'>🚀</span>
                  <div>
                    <span className='sd-detail-label'>Launcher</span>
                    <span className='sd-detail-value'>{product.launcher}</span>
                  </div>
                </div>
              )}
              {product.deliveryTime && (
                <div className='sd-detail-item'>
                  <span className='sd-detail-icon'>⏱️</span>
                  <div>
                    <span className='sd-detail-label'>Delivery time</span>
                    <span className='sd-detail-value sd-accent'>{product.deliveryTime}</span>
                  </div>
                </div>
              )}
              {product.warrantyDays > 0 && (
                <div className='sd-detail-item'>
                  <span className='sd-detail-icon'>🛡️</span>
                  <div>
                    <span className='sd-detail-label'>Warranty</span>
                    <span className='sd-detail-value'>{product.warrantyDays}-day anti-ban warranty</span>
                  </div>
                </div>
              )}
              {product.fulfillmentMethod && (
                <div className='sd-detail-item sd-detail-full'>
                  <span className='sd-detail-icon'>📦</span>
                  <div>
                    <span className='sd-detail-label'>Fulfillment method</span>
                    <span className='sd-detail-value'>{FULFILLMENT_LABELS[product.fulfillmentMethod] || product.fulfillmentMethod}</span>
                  </div>
                </div>
              )}
              {product.supportedRegions && (
                <div className='sd-detail-item'>
                  <span className='sd-detail-icon'>🌍</span>
                  <div>
                    <span className='sd-detail-label'>Supported regions</span>
                    <span className='sd-detail-value'>{product.supportedRegions}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {product.requirements && (
            <section className='sd-section'>
              <h2 className='sd-section-title'>Requirements</h2>
              <div className='sd-requirements'>
                <span className='sd-req-icon'>📋</span>
                <p>{product.requirements}</p>
              </div>
            </section>
          )}

          {product.importantNotes && (
            <section className='sd-section'>
              <h2 className='sd-section-title'>Important information</h2>
              <div className='sd-important-notes'>
                <span className='sd-notes-icon'>⚠️</span>
                <p>{product.importantNotes}</p>
              </div>
            </section>
          )}

          <section className='sd-section'>
            <h2 className='sd-section-title'>Frequently asked questions</h2>
            <div className='sd-faq-list'>
              {faqs.map((faq, i) => (
                <details key={i} className='sd-faq-item' open={activeFaq === i}>
                  <summary className='sd-faq-q' onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <span className='sd-faq-arrow'>{activeFaq === i ? '−' : '+'}</span>
                  </summary>
                  <p className='sd-faq-a'>{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className='sd-section'>
            <h2 className='sd-section-title'>Customer reviews</h2>
            {reviews.length > 0 ? (
              <div className='sd-reviews-list'>
                {reviews.slice(0, 10).map((review, i) => (
                  <div key={i} className='sd-review-item'>
                    <div className='sd-review-header'>
                      <span className='sd-review-name'>{review.name}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className='sd-review-comment'>{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className='sd-no-reviews'>No reviews yet. Be the first to review this service!</p>
            )}

            <form className='sd-review-form' onSubmit={handleSubmitReview}>
              <h3>Leave a review</h3>
              <label>
                Name
                <input value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} required maxLength={80} />
              </label>
              <label>
                Rating
                <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </label>
              <label>
                Comment
                <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} required maxLength={2000} rows={4} />
              </label>
              <button className='sd-btn-primary' type='submit'>Submit review</button>
              {reviewStatus && <p className='sd-review-status'>{reviewStatus}</p>}
            </form>
          </section>
        </div>

        <aside className='sd-sidebar'>
          <div className='sd-pricing-card'>
            <div className='sd-price-row'>
              {discountPct > 0 && (
                <span className='sd-discount-badge'>-{discountPct}%</span>
              )}
            </div>
            <div className='sd-price-main'>
              {product.originalPrice && <span className='sd-original-price'>{product.originalPrice}</span>}
              <span className='sd-current-price'>{product.price}</span>
            </div>
            <div className='sd-pricing-info'>
              {product.deliveryTime && (
                <div className='sd-pricing-item'>
                  <span>⏱️</span> Delivery: {product.deliveryTime}
                </div>
              )}
              {product.warrantyDays > 0 && (
                <div className='sd-pricing-item'>
                  <span>🛡️</span> {product.warrantyDays}-day warranty included
                </div>
              )}
              {product.stock && (
                <div className='sd-pricing-item'>
                  <span>📦</span> {product.stock}
                </div>
              )}
            </div>
            <a href={'/order?productId='+product.id} className='sd-btn-buy'>
              Buy now
            </a>
            <p className='sd-secure-note'>🔒 Secure checkout via Razorpay</p>
          </div>

          <div className='sd-support-card'>
            <h3>Need help?</h3>
            <p>Contact our support team for questions about this service.</p>
            <div className='sd-support-links'>
              {process.env.NEXT_PUBLIC_DISCORD_LINK && (
                <a href={process.env.NEXT_PUBLIC_DISCORD_LINK} target='_blank' rel='noopener noreferrer' className='sd-btn-discord'>
                  💬 Discord
                </a>
              )}
              {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                <a href={'https://wa.me/'+process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/[^0-9]/g, '')} target='_blank' rel='noopener noreferrer' className='sd-btn-whatsapp'>
                  📱 WhatsApp
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}