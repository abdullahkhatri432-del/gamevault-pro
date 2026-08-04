'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

const OFF_PLATFORM_KEYWORDS = ['whatsapp', 'discord', 'paytm', 'direct upi', 'phone number', 'instagram', 'telegram', 'snapchat'];

function containsOffPlatformKeywords(message) {
  const lower = message.toLowerCase();
  return OFF_PLATFORM_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function OrderChatPage() {
  const params = useParams();
  const orderId = params.orderId;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setThread(data.thread);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const hasOffPlatform = containsOffPlatformKeywords(input);
    if (hasOffPlatform) {
      setWarning('System Warning: Off-platform dealings violate GameVault terms and instantly void customer warranty & booster escrow payouts.');
      setTimeout(() => setWarning(''), 5000);
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, message: input }),
    });

    if (response.ok) {
      setInput('');
      loadMessages();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

        {warning && (
          <div className="bg-[#F59E0B20] border border-[#F59E0B50] rounded-lg p-4 mb-4">
            <p className="text-[#F59E0B] text-sm">⚠️ {warning}</p>
          </div>
        )}

        <div className="bg-[#18181B] border border-[#374151] rounded-xl overflow-hidden">
          <div className="chat-messages" style={{ height: '500px', overflowY: 'auto', padding: '1rem' }}>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#9CA3AF]">No messages yet. Start the conversation with your booster.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender_type}${msg.flagged ? ' flagged' : ''}`} style={{ marginBottom: '1rem' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded ${msg.sender_type === 'customer' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : msg.sender_type === 'booster' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                      {msg.sender_type === 'customer' ? '👤 You' : msg.sender_type === 'booster' ? '🔧 Booster' : '🛡️ Admin'}
                    </span>
                    <span className="text-[#9CA3AF] text-xs">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    {msg.flagged ? <span className="text-[#EF4444] text-xs">⚠️ {msg.flag_reason}</span> : null}
                  </div>
                  <div className={`p-3 rounded-lg ${msg.sender_type === 'customer' ? 'bg-[#8B5CF6]/10 ml-8' : msg.sender_type === 'booster' ? 'bg-[#10B981]/10 mr-8' : 'bg-[#F59E0B]/10'}`}>
                    <p className="text-white">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[#374151] p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white focus:border-[#8B5CF6] focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors font-medium"
              >
                Send
              </button>
            </div>
            <p className="text-[#9CA3AF] text-xs mt-2">🔒 Do not share personal contact info. All chats are monitored for your protection.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
