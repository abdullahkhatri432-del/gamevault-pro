'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const createEmptyProduct = () => ({
  title: '',
  price: '',
  tag: '',
  rating: '4.8',
  stock: 'In stock',
  category: 'Game',
  imageUrl: '',
  description: '',
});

const formatPaise = (paise) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN')}`;

export default function AdminPage() {
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [productDrafts, setProductDrafts] = useState([]);
  const [productForm, setProductForm] = useState(createEmptyProduct());
  const [productStatus, setProductStatus] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [revealedCredentials, setRevealedCredentials] = useState({});
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percent', discountValue: '', maxUses: 0, expiresAt: '' });
  const [couponStatus, setCouponStatus] = useState('');

  const hydrateStore = async () => {
    const storeResponse = await fetch('/api/store');
    const storeData = await storeResponse.json();
    setStore(storeData);
    setProductDrafts(storeData.featuredAccounts.map((product) => ({ ...product })));
  };

  useEffect(() => {
    async function hydrateData() {
      const authResponse = await fetch('/api/admin/me');
      if (!authResponse.ok) {
        setCheckingAuth(false);
        router.replace('/admin/login');
        return;
      }

      const [storeResponse, ordersResponse, reviewsResponse, couponsResponse] = await Promise.all([
        fetch('/api/store'),
        fetch('/api/orders'),
        fetch('/api/reviews'),
        fetch('/api/admin/coupons'),
      ]);

      const storeData = await storeResponse.json();
      setStore(storeData);
      setProductDrafts(storeData.featuredAccounts.map((product) => ({ ...product })));
      setOrders(await ordersResponse.json());
      setReviews(await reviewsResponse.json());
      setCoupons((await couponsResponse.json()).coupons || []);
      setCheckingAuth(false);
    }

    hydrateData();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();

    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productForm),
    });

    if (!response.ok) {
      const result = await response.json();
      setProductStatus(result.message || 'Unable to add the product.');
      return;
    }

    setProductStatus('Product added successfully.');
    setProductForm(createEmptyProduct());
    await hydrateStore();
  };

  const handleUpdateProduct = async (product) => {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      const result = await response.json();
      setProductStatus(result.message || 'Unable to update the product.');
      return;
    }

    setProductStatus('Product updated successfully.');
    await hydrateStore();
  };

  const handleDeleteProduct = async (productId) => {
    const response = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });

    if (!response.ok) {
      const result = await response.json();
      setProductStatus(result.message || 'Unable to delete the product.');
      return;
    }

    setProductStatus('Product deleted successfully.');
    await hydrateStore();
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const result = await response.json();
      setProductStatus(result.message || 'Unable to update the order.');
      return;
    }

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  };

  const handleRevealCredentials = async (orderId) => {
    if (revealedCredentials[orderId]) {
      setRevealedCredentials((current) => ({ ...current, [orderId]: null }));
      return;
    }

    const response = await fetch(`/api/admin/orders/${orderId}/credentials`);
    if (!response.ok) {
      const result = await response.json();
      setProductStatus(result.message || 'Unable to decrypt credentials.');
      return;
    }

    const credentials = await response.json();
    setRevealedCredentials((current) => ({ ...current, [orderId]: credentials }));
  };

  const handleCreateCoupon = async (event) => {
    event.preventDefault();

    const response = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(couponForm),
    });

    const result = await response.json();
    if (!response.ok) {
      setCouponStatus(result.message || 'Unable to create the promo code.');
      return;
    }

    setCouponStatus(`Promo code ${result.code} created.`);
    setCouponForm({ code: '', discountType: 'percent', discountValue: '', maxUses: 0, expiresAt: '' });
    setCoupons((current) => [result, ...current]);
  };

  const handleToggleCoupon = async (coupon) => {
    const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: coupon.active === 1 ? 0 : 1 }),
    });

    if (!response.ok) {
      const result = await response.json();
      setCouponStatus(result.message || 'Unable to update the promo code.');
      return;
    }

    setCoupons((current) =>
      current.map((item) =>
        item.id === coupon.id ? { ...item, active: item.active === 1 ? 0 : 1 } : item
      )
    );
  };

  const handleDeleteCoupon = async (coupon) => {
    const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' });
    if (!response.ok) {
      const result = await response.json();
      setCouponStatus(result.message || 'Unable to delete the promo code.');
      return;
    }

    setCoupons((current) => current.filter((item) => item.id !== coupon.id));
  };

  if (checkingAuth) {
    return <main className="admin-shell"><p>Checking admin access…</p></main>;
  }

  if (!store) {
    return <main className="admin-shell"><p>Loading admin dashboard…</p></main>;
  }

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div>
          <span className="eyebrow">Admin dashboard</span>
          <h1>Marketplace control center</h1>
        </div>
        <div className="admin-hero-actions">
          <a className="secondary-btn" href="/">Back to storefront</a>
          <button className="ghost-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </section>

      <section className="admin-stats">
        <article className="admin-stat">
          <span>Orders completed</span>
          <strong>{store.stats.ordersCompleted}</strong>
        </article>
        <article className="admin-stat">
          <span>Repeat buyers</span>
          <strong>{store.stats.repeatBuyers}%</strong>
        </article>
        <article className="admin-stat">
          <span>Average rating</span>
          <strong>{store.stats.averageRating} ★</strong>
        </article>
        <article className="admin-stat">
          <span>Fulfillment status</span>
          <strong>{orders.filter(o => o.status === 'in_progress').length} In Progress</strong>
        </article>
      </section>

      <section className="admin-grid admin-wide-grid">
        <article className="admin-card">
          <h2>Catalog manager</h2>
          <form className="product-admin-form" onSubmit={handleCreateProduct}>
            <label>
              Game title
              <input value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} placeholder="GTA 5 Money 30M" />
            </label>
            <label>
              Price (INR)
              <input value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} placeholder="₹2,499" />
            </label>
            <label>
              Tag
              <input value={productForm.tag} onChange={(event) => setProductForm({ ...productForm, tag: event.target.value })} placeholder="In-game currency" />
            </label>
            <label>
              Category
              <input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} placeholder="In-game currency / Level boost / Upgrade" />
            </label>
            <label>
              Rating
              <input value={productForm.rating} onChange={(event) => setProductForm({ ...productForm, rating: event.target.value })} placeholder="4.8" />
            </label>
            <label>
              Stock
              <input value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} placeholder="In stock" />
            </label>
            <label>
              Image URL
              <input value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} placeholder="https://example.com/image.jpg" />
            </label>
            <label>
              Description
              <textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} placeholder="Short description for the product." />
            </label>
            <button className="primary-btn" type="submit">Add product</button>
            {productStatus ? <p className="status-text">{productStatus}</p> : null}
          </form>
        </article>

        <article className="admin-card">
          <h2>Orders ({orders.length})</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <div className="order-admin-list">
              {orders.map((order) => (
                <div className="order-admin-item" key={order.id}>
                  <div className="order-admin-head">
                    <strong>{order.name}</strong>
                    <span className={`status-badge status-${order.status}`}>{order.status}</span>
                    {order.serviceType && (
                      <span className="service-badge">{order.serviceType}</span>
                    )}
                  </div>
                  <p className="order-admin-meta">{order.game} · {order.launcher} · {formatPaise(order.amountPaise)}{order.discountPaise > 0 ? ` (was ${formatPaise(order.amountPaise + order.discountPaise)} · code ${order.couponCode})` : ''}</p>
                  <p className="order-admin-meta">{order.email}</p>
                  {order.note ? <p className="order-admin-note">{order.note}</p> : null}
                  {order.platformType && (
                    <p className="order-admin-meta">Platform: {order.platformType} · Discord: {order.discordUsername || 'Not set'}</p>
                  )}
                  {order.deliveryEta && (
                    <p className="order-admin-meta">ETA: {order.deliveryEta}</p>
                  )}

                  <div className="credentials-block">
                    {order.accountId ? (
                      <button className="ghost-btn small" type="button" onClick={() => handleRevealCredentials(order.id)}>
                        {revealedCredentials[order.id] ? 'Hide credentials' : 'Show credentials'}
                      </button>
                    ) : null}
                    {revealedCredentials[order.id] ? (
                      <div className="credentials-revealed">
                        <div><span>Account ID</span><code>{revealedCredentials[order.id].accountId || '(empty)'}</code></div>
                        <div><span>Password</span><code>{revealedCredentials[order.id].accountPassword || '(empty)'}</code></div>
                        {revealedCredentials[order.id].twofaBackupCode && (
                          <div><span>2FA Backup Code</span><code>{revealedCredentials[order.id].twofaBackupCode}</code></div>
                        )}
                      </div>
                    ) : null}
                    {order.status === 'in_progress' && (
                      <button
                        className="ghost-btn small"
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/orders?action=generate-otp`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: order.id, agentId: 'admin' })
                          });
                          setProductStatus('OTP generated and notification sent to customer.');
                        }}
                      >
                        Request 2FA OTP
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <button
                        className="ghost-btn small"
                        type="button"
                        onClick={async () => {
                          if (confirm('This will permanently purge all sensitive data. Are you sure?')) {
                            await fetch(`/api/orders?action=purge-data`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orderId: order.id })
                            });
                            setOrders(orders => orders.map(o => o.id === order.id ? { ...o, accountId: null, accountPassword: null, twofaBackupCode: null, sensitiveDataPurged: 1 } : o));
                            setProductStatus('Sensitive data purged successfully.');
                          }
                        }}
                      >
                        Purge Sensitive Data
                      </button>
                    )}
                  </div>

                  <div className="order-admin-actions">
                    {['pending', 'paid', 'in_progress', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        className={`ghost-btn small${order.status === status ? ' active' : ''}`}
                        type="button"
                        onClick={() => handleUpdateOrderStatus(order.id, status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="admin-grid admin-wide-grid">
        <article className="admin-card">
          <h2>Manage storefront inventory</h2>
          <div className="inventory-list">
            {productDrafts.map((product) => (
              <div className="inventory-item" key={product.id ?? product.title}>
                <div className="inventory-thumb">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.title} /> : <span>No image</span>}
                </div>
                <div className="inventory-fields">
                  <label>
                    Title
                    <input value={product.title} onChange={(event) => setProductDrafts(productDrafts.map((entry) => entry.id === product.id ? { ...entry, title: event.target.value } : entry))} />
                  </label>
                  <label>
                    Price
                    <input value={product.price} onChange={(event) => setProductDrafts(productDrafts.map((entry) => entry.id === product.id ? { ...entry, price: event.target.value } : entry))} />
                  </label>
                  <label>
                    Tag
                    <input value={product.tag} onChange={(event) => setProductDrafts(productDrafts.map((entry) => entry.id === product.id ? { ...entry, tag: event.target.value } : entry))} />
                  </label>
                  <label>
                    Category
                    <input value={product.category || 'Game'} onChange={(event) => setProductDrafts(productDrafts.map((entry) => entry.id === product.id ? { ...entry, category: event.target.value } : entry))} />
                  </label>
                  <label>
                    Rating
                    <input value={product.rating} onChange={(event) => setProductDrafts(productDrafts.map((entry) => entry.id === product.id ? { ...entry, rating: event.target.value } : entry))} />
                  </label>
                  <label>
                    Stock
                    <input value={product.stock} onChange={(event) => setProductDrafts(productDrafts.map((entry) => entry.id === product.id ? { ...entry, stock: event.target.value } : entry))} />
                  </label>
                  <label>
                    Image URL
                    <input value={product.imageUrl || ''} onChange={(event) => setProductDrafts(productDrafts.map((entry) => entry.id === product.id ? { ...entry, imageUrl: event.target.value } : entry))} />
                  </label>
                  <label>
                    Description
                    <textarea value={product.description || ''} onChange={(event) => setProductDrafts(productDrafts.map((entry) => entry.id === product.id ? { ...entry, description: event.target.value } : entry))} />
                  </label>
                  <div className="inventory-actions">
                    <button className="secondary-btn" type="button" onClick={() => handleUpdateProduct(product)}>Save</button>
                    <button className="ghost-btn" type="button" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <h2>Promo codes ({coupons.length})</h2>
          <form className="admin-form" onSubmit={handleCreateCoupon}>
            <label>
              Code
              <input value={couponForm.code} onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value })} placeholder="e.g. GTA50" />
            </label>
            <label>
              Type
              <select value={couponForm.discountType} onChange={(event) => setCouponForm({ ...couponForm, discountType: event.target.value })}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </label>
            <label>
              Value
              <input type="number" min="1" value={couponForm.discountValue} onChange={(event) => setCouponForm({ ...couponForm, discountValue: event.target.value })} placeholder="e.g. 10 or 500" />
            </label>
            <label>
              Max uses (0 = unlimited)
              <input type="number" min="0" value={couponForm.maxUses} onChange={(event) => setCouponForm({ ...couponForm, maxUses: event.target.value })} />
            </label>
            <label>
              Expires at (optional)
              <input type="datetime-local" value={couponForm.expiresAt} onChange={(event) => setCouponForm({ ...couponForm, expiresAt: event.target.value })} />
            </label>
            <button className="primary-btn" type="submit">Create promo code</button>
          </form>
          {couponStatus ? <p className="status-text">{couponStatus}</p> : null}
          {coupons.length === 0 ? (
            <p>No promo codes yet.</p>
          ) : (
            coupons.map((coupon) => (
              <div className="admin-row" key={coupon.id}>
                <div>
                  <strong>{coupon.code}</strong>
                  <p>
                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                    {' · '}
                    {coupon.used_count}/{coupon.max_uses === 0 ? '∞' : coupon.max_uses} used
                    {coupon.expires_at ? ` · expires ${new Date(coupon.expires_at).toLocaleString('en-IN')}` : ''}
                  </p>
                </div>
                <div className="inventory-actions">
                  <button className="secondary-btn" type="button" onClick={() => handleToggleCoupon(coupon)}>
                    {coupon.active === 1 ? 'Disable' : 'Enable'}
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => handleDeleteCoupon(coupon)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </article>

        <article className="admin-card">
          <h2>Customer reviews</h2>
          {reviews.map((review, index) => (
            <div className="admin-row" key={`${review.name}-${index}`}>
              <div>
                <strong>{review.name}</strong>
                <p>{review.rating} ★</p>
              </div>
              <div>
                <span>{review.comment}</span>
              </div>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
