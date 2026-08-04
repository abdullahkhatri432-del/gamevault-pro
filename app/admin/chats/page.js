'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminChatsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function checkAuth() {
      const authResponse = await fetch('/api/admin/me');
      if (!authResponse.ok) {
        router.replace('/admin/login');
        return;
      }
      setCheckingAuth(false);
      loadThreads();
    }
    checkAuth();
  }, [router]);

  const loadThreads = async () => {
    const response = await fetch('/api/chat');
    if (response.ok) {
      const data = await response.json();
      setThreads(data.threads || []);
    }
  };

  const loadMessages = async (orderId) => {
    const response = await fetch(`/api/chat?orderId=${orderId}`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages || []);
      setSelectedThread(data.thread);
    }
  };

  const sendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedThread) return;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: selectedThread.order_id,
        message: adminMessage,
        senderType: 'admin',
      }),
    });

    if (response.ok) {
      setAdminMessage('');
      loadMessages(selectedThread.order_id);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const flaggedThreads = threads.filter((t) => {
    const msgs = threads.filter((m) => m.thread_id === t.id && m.flagged);
    return msgs.length > 0;
  });

  const filteredThreads = filter === 'flagged'
    ? threads.filter((t) => flaggedThreads.includes(t))
    : threads;

  if (checkingAuth) {
    return <main className="admin-shell"><p>Checking admin access...</p></main>;
  }

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div>
          <span className="eyebrow">Chat Monitor</span>
          <h1>Live Chat Audit</h1>
        </div>
        <div className="admin-hero-actions">
          <a className="secondary-btn" href="/admin">Back to Admin</a>
        </div>
      </section>

      <section className="admin-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <article className="admin-card">
          <h2>Active Threads ({filteredThreads.length})</h2>
          <div className="filter-row">
            <button className={`filter-chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`filter-chip${filter === 'flagged' ? ' active' : ''}`} onClick={() => setFilter('flagged')}>⚠️ Flagged</button>
          </div>
          <div className="thread-list">
            {filteredThreads.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>No active chats</h3>
                <p>Customer-modder chats will appear here.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`thread-item${selectedThread?.id === thread.id ? ' active' : ''}`}
                  onClick={() => loadMessages(thread.order_id)}
                >
                  <div className="thread-header">
                    <strong>Order #{thread.order_id}</strong>
                    <span className={`status-badge status-${thread.status}`}>{thread.status}</span>
                  </div>
                  <p className="thread-meta">{thread.customer_email}</p>
                  <p className="thread-time">{new Date(thread.updated_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="admin-card">
          {selectedThread ? (
            <>
              <h2>Chat: Order #{selectedThread.order_id}</h2>
              <div className="chat-messages" style={{ height: '400px', overflowY: 'auto', padding: '1rem', background: '#09090B', borderRadius: '8px', marginBottom: '1rem' }}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.sender_type}${msg.flagged ? ' flagged' : ''}`}>
                    <div className="message-header">
                      <span className={`sender-badge ${msg.sender_type}`}>
                        {msg.sender_type === 'admin' ? '🛡️ Admin' : msg.sender_type === 'booster' ? '🔧 Booster' : '👤 Customer'}
                      </span>
                      <span className="message-time">{new Date(msg.created_at).toLocaleTimeString()}</span>
                      {msg.flagged ? <span className="flag-badge">⚠️ {msg.flag_reason}</span> : null}
                    </div>
                    <p className="message-text">{msg.message}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input">
                <input
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Send message as Admin..."
                  onKeyDown={(e) => e.key === 'Enter' && sendAdminMessage()}
                />
                <button className="primary-btn" onClick={sendAdminMessage}>Send as Admin</button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>Select a chat thread</h3>
              <p>Choose a thread from the left to monitor messages.</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
