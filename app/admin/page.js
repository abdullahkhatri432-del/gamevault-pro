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

export default function AdminPage() {
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [productDrafts, setProductDrafts] = useState([]);
  const [productForm, setProductForm] = useState(createEmptyProduct());
  const [productStatus, setProductStatus] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

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

      const [storeResponse, ordersResponse, reviewsResponse] = await Promise.all([
        fetch('/api/store'),
        fetch('/api/orders'),
        fetch('/api/reviews'),
      ]);

      const storeData = await storeResponse.json();
      setStore(storeData);
      setProductDrafts(storeData.featuredAccounts.map((product) => ({ ...product })));
      setOrders(await ordersResponse.json());
      setReviews(await reviewsResponse.json());
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
      </section>

      <section className="admin-grid admin-wide-grid">
        <article className="admin-card">
          <h2>Catalog manager</h2>
          <form className="product-admin-form" onSubmit={handleCreateProduct}>
            <label>
              Game title
              <input value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} placeholder="New game title" />
            </label>
            <label>
              Price
              <input value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} placeholder="$19" />
            </label>
            <label>
              Tag
              <input value={productForm.tag} onChange={(event) => setProductForm({ ...productForm, tag: event.target.value })} placeholder="Legendary skin bundle" />
            </label>
            <label>
              Category
              <input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} placeholder="FPS" />
            </label>
            <label>
              Rating
              <input value={productForm.rating} onChange={(event) => setProductForm({ ...productForm, rating: event.target.value })} placeholder="4.8" />
            </label>
            <label>
              Stock
              <input value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} placeholder="12 left" />
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
          <h2>Open orders</h2>
          {orders.length === 0 ? <p>No orders yet.</p> : orders.map((order) => (
            <div className="admin-row" key={order.id}>
              <div>
                <strong>{order.name}</strong>
                <p>{order.game}</p>
              </div>
              <div>
                <span>{order.email}</span>
                <small>{order.note || 'No extra note'}</small>
              </div>
            </div>
          ))}
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
