'use client';

import { useState, useRef, useEffect } from 'react';

const FAQ_RESPONSES = {
  'order status': 'To check your order status, please visit your Dashboard at /dashboard and click on "My Orders". You can track your order progress there.',
  'warranty': 'Our 30-Day Anti-Ban Warranty covers all delivered orders for 30 calendar days. If you encounter any issues, contact us within 24 hours of delivery to keep your warranty active.',
  '2fa': 'For 2FA backup codes, please check your authenticator app or recovery codes. If you need help, the assigned booster can assist you through the order chat.',
  'refund': 'Refunds are processed within 7-14 business days for eligible orders. Contact support with your order ID for assistance.',
  'delivery': 'Delivery times vary by service type:\n• Currency/Credits: 30-60 minutes\n• Level Boosts: 2-4 hours\n• Account Services: Same session',
  'payment': 'We accept UPI, credit/debit cards, and net banking through Razorpay. All payments are secure and encrypted.',
  'report': 'To report an order anomaly, go to Dashboard > My Orders > select the order > click "Report Order Anomaly". You have 24 hours from delivery to report.',
  'booster': 'To become a verified booster, visit /boosters and complete the onboarding process. KYC verification is required.',
  'chat': 'You can chat with your assigned booster through the order chat in your Dashboard. All chats are monitored for your safety.',
  'launcher': 'Currently active launchers vary by game. Check the catalog for available services. Inactive launchers have a waitlist option.',
};

const QUICK_ACTIONS = [
  { label: 'Check Order Status', query: 'order status' },
  { label: 'Warranty Info', query: 'warranty' },
  { label: 'Delivery Times', query: 'delivery' },
  { label: 'Report Issue', query: 'report' },
];

function findResponse(input) {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key)) {
      return response;
    }
  }
  return "I'm here to help! For specific order issues, please provide your order ID or visit your Dashboard. For urgent matters, contact support via Discord or WhatsApp.";
}

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm GameVault Pro's AI Support. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = findResponse(text);
      setMessages((prev) => [...prev, { role: 'bot', text: response }]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <strong>GameVault Pro Support</strong>
              <span className="chatbot-status">● Online</span>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.role}`}>
                {msg.role === 'bot' && <span className="chatbot-avatar">🤖</span>}
                <div className={`chatbot-bubble ${msg.role}`}>
                  {msg.text.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chatbot-message bot">
                <span className="chatbot-avatar">🤖</span>
                <div className="chatbot-bubble bot typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="chatbot-quick-actions">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.query} className="quick-action-btn" onClick={() => sendMessage(action.query)}>
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div className="chatbot-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
            />
            <button className="chatbot-send" onClick={() => sendMessage(input)}>➤</button>
          </div>
        </div>
      )}

      <button className="chatbot-fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
