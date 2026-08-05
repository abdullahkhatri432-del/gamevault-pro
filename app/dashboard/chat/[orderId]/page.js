'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

const MAX_MESSAGE_LENGTH = 2000;

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds}s ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 1) return `${minutes}m ago`;
  const days = Math.floor(hours / 24);
  if (days < 1) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString();
}

export default function OrderChatPage() {
  const params = useParams();
  const orderId = params.orderId;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0);
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setThread(data.thread);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRateLimitRetryAt(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const markAsRead = async (messageId) => {
    if (!thread) return;
    try {
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, lastReadMessageId: messageId }),
      });
    } catch {}
  };

  useEffect(() => {
    if (messages.length > 0 && thread) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_type !== 'customer') {
        markAsRead(lastMsg.id);
      }
    }
  }, [messages, thread]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    setSendError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, message: input }),
      });

      if (response.status === 429) {
        const data = await response.json();
        const retry = data.retryAfter || 60;
        setRateLimitRetryAt(Date.now() + retry * 1000);
        setCountdown(retry);
        setSendError(`Rate limited. Please wait ${retry} seconds.`);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to send message');
      }

      setInput('');
      setSendError('');
      await loadMessages();
    } catch (err) {
      setSendError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isRead = (msg) => {
    if (msg.sender_type !== 'customer') return false;
    if (!thread?.last_read_message_id) return false;
    return msg.id <= thread.last_read_message_id;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <a href="/dashboard" className="text-[#8B5CF6] text-sm">← Back to Dashboard</a>
            <h1 className="text-2xl font-bold">Order #{orderId} Chat</h1>
          </div>
          <div className="text-right">
            <span className="text-[#9CA3AF] text-sm">Messages are monitored for safety</span>
          </div>
        </header>

        {error && (
          <div className="bg-[#EF444420] border border-[#EF444450] rounded-lg p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[#EF4444] font-medium">Error loading messages</p>
              <p className="text-[#EF4444]/80 text-sm">{error}</p>
            </div>
            <button
              onClick={loadMessages}
              className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] rounded-lg text-white text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {warning && (
          <div className="bg-[#F59E0B20] border border-[#F59E0B50] rounded-lg p-4 mb-4">
            <p className="text-[#F59E0B] text-sm">Warning: {warning}</p>
          </div>
        )}

        <div className="bg-[#18181B] border border-[#374151] rounded-xl overflow-hidden">
          <div className="chat-messages" style={{ height: '500px', overflowY: 'auto', padding: '1rem' }}>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-[#9CA3AF]">No messages yet. Send the first message to start the conversation with your support team.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded ${msg.sender_type === 'customer' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : msg.sender_type === 'booster' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                      {msg.sender_type === 'customer' ? 'You' : msg.sender_type === 'booster' ? 'Booster' : 'Admin'}
                    </span>
                    <span
                      className="text-[#9CA3AF] text-xs cursor-default"
                      title={formatDate(msg.created_at)}
                    >
                      {timeAgo(msg.created_at)}
                    </span>
                    {msg.sender_type !== 'admin' && msg.flagged ? <span className="text-[#EF4444] text-xs">Flagged</span> : null}
                  </div>
                  <div className={`p-3 rounded-lg ${msg.sender_type === 'customer' ? 'bg-[#8B5CF6]/10 ml-8' : msg.sender_type === 'booster' ? 'bg-[#10B981]/10 mr-8' : 'bg-[#F59E0B]/10'}`}>
                    <p className="text-white">{msg.message}</p>
                  </div>
                  {msg.sender_type === 'customer' && (
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-[#9CA3AF]" title={isRead(msg) ? 'Read' : 'Sent'}>
                        {isRead(msg) ? '✓✓' : '✓'}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[#374151] p-4">
            {sendError && (
              <div className="bg-[#EF444420] border border-[#EF444440] rounded-lg p-3 mb-3">
                <p className="text-[#EF4444] text-sm">{sendError}</p>
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={countdown > 0 ? `Wait ${countdown}s...` : 'Type your message...'}
                disabled={countdown > 0}
                className="flex-1 px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={sending || countdown > 0 || !input.trim() || input.length > MAX_MESSAGE_LENGTH}
                className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : countdown > 0 ? `${countdown}s` : 'Send'}
              </button>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-[#9CA3AF] text-xs">Do not share personal contact info. All chats are monitored for your protection.</p>
              <span className={`text-xs ${input.length > MAX_MESSAGE_LENGTH ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
                {input.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}