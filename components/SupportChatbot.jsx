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

const style = `
  .chatbot-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .chatbot-fab {
    background: linear-gradient(135deg, #8B5CF6, #A855F7);
    color: #FFFFFF;
    border: none;
    border-radius: 50%;
    width: 64px;
    height: 64px;
    font-size: 26px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.35);
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .chatbot-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 12px 32px rgba(139, 92, 246, 0.45);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .chatbot-fab:active {
    transform: scale(0.95);
  }

  .chatbot-window {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 380px;
    max-height: 560px;
    background: #18181B;
    border: 1px solid #27272A;
    border-radius: 16px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.55);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(12px);
  }

  .chatbot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    background: rgba(139, 92, 246, 0.1);
    border-bottom: 1px solid #27272A;
  }

  .chatbot-header strong {
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
  }

  .chatbot-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #22C55E;
    font-weight: 500;
  }

  .chatbot-status::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22C55E;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }

  .chatbot-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #9CA3AF;
    font-size: 18px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chatbot-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #FFFFFF;
  }

  .chatbot-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .chatbot-message {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    max-width: 85%;
  }

  .chatbot-message.bot {
    align-self: flex-start;
  }

  .chatbot-message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .chatbot-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(139, 92, 247, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .chatbot-message.user .chatbot-avatar {
    background: linear-gradient(135deg, #8B5CF6, #A855F7);
  }

  .chatbot-bubble {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
  }

  .chatbot-bubble.bot {
    background: #27272A;
    border-bottom-left-radius: 6px;
    color: #E5E7EB;
  }

  .chatbot-bubble.user {
    background: linear-gradient(135deg, #8B5CF6, #A855F7);
    border-bottom-right-radius: 6px;
    color: #FFFFFF;
  }

  .chatbot-bubble.bot p {
    margin: 0;
    color: #D1D5DB;
  }

  .chatbot-bubble.user p {
    margin: 0;
    color: #FFFFFF;
  }

  .chatbot-bubble.typing {
    background: #27272A;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .typing .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9CA3AF;
    display: inline-block;
    animation: bounce 0.6s ease-in-out 0s infinite both;
  }

  .typing .dot:nth-child(1) { animation-delay: -0.32s; }
  .typing .dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0) translateY(0); opacity: 0.6; }
    40% { transform: scale(1) translateY(-6px); opacity: 1; }
  }

  .chatbot-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 14px 20px;
    border-top: 1px solid #27272A;
    background: rgba(255, 255, 255, 0.02);
  }

  .quick-action-btn {
    background: #27272A;
    color: #CBD5E1;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 110px;
  }

  .quick-action-btn:hover {
    background: #374151;
    color: #FFFFFF;
    border-color: #8B5CF6;
  }

  .chatbot-input {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-top: 1px solid #27272A;
    background: rgba(255, 255, 255, 0.02);
  }

  .chatbot-input input {
    flex: 1;
    background: #27272A;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    color: #E5E7EB;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .chatbot-input input:focus {
    border-color: #8B5CF6;
  }

  .chatbot-input input::placeholder {
    color: #6B7280;
  }

  .chatbot-send {
    background: linear-gradient(135deg, #8B5CF6, #A855F7);
    color: #FFFFFF;
    border: none;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .chatbot-send:hover {
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35);
  }

  .chatbot-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

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

  if (typeof window !== 'undefined') {
    if (!document.getElementById('chatbot-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'chatbot-styles';
      styleEl.textContent = style;
      document.head.appendChild(styleEl);
    }
  }

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
              <span className="chatbot-status">Online</span>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.role}`}>
                {msg.role === 'bot' && <span className="chatbot-avatar">🤖</span>}
                {msg.role === 'user' && <span className="chatbot-avatar">👤</span>}
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

          {messages.length <= 1 && !isTyping && (
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
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  );
}
