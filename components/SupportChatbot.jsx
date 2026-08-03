"""AI Support Chatbot Widget - GameVault Pro"""

import { useState, useEffect, useRef } from 'react';

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [orderStatus, setOrderStatus] = useState({ isVisible: false, orderId: '', email: '' });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: "👋 Hi there! I'm BoostVerse AI Support. How can I help you with your GTA V gaming service today?",
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'track-order':
        setOrderStatus({ isVisible: true, orderId: '', email: '' });
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: "📦 Please provide your Order ID and Email address to track your order:",
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        break;
      case 'warranty':
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: "🛡️ **30-Day Anti-Ban Warranty**

✅ **What it covers:**
• GTA Online account security
• Delivery failures
• Data loss protection
• Game access issues

🔒 **How it works:**
1. All orders come with automatic warranty
2. Delivery completed within 15-45 minutes
3. All credentials encrypted & tested before delivery
4. Real-time support during delivery

📞 **Need help?** Contact support immediately if issues arise!",
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        break;
      case '2fa-codes':
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: "🔐 **How to Get 2FA Backup Codes**

**Step 1:** Open your authenticator app (Google Authenticator, Authy, etc.)

**Step 2:** Add new account
- **Platform:** GameVault Pro GTA V Services
- **Account:** Your email address
- **Secret Key:** (provided during checkout)

**Step 3:** Save the 6 backup codes
- Store securely in a password manager
- Keep a backup in your cloud storage
- Never share these codes!

**💡 Pro Tips:**
• Generate new codes every 30 days
• Use a secure password manager
• Keep emergency backup offline

Need help with a specific platform? Let me know!",
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        break;
      case 'human-agent':
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: "🎧 **Connecting you with a human agent...**

Please wait while we connect you to our Discord support server. This will only take a moment.

🔗 **Direct Discord Link:** [Click here to join](https://discord.gg/gamevault-pro)

📱 **WhatsApp Support:** +1-XXX-XXX-XXXX

⏰ **Our Hours:** 24/7 Live Support

Your ticket will be prioritized and our agents are ready to help you instantly!",
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        break;
      default:
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: generateBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();

    if (input.includes('delivery') || input.includes('when')) {
      return "📦 **Delivery Timings:**

🕐 **Standard Services:** 15-30 minutes
🕐 **Premium Accounts:** 30-45 minutes
🕐 **Modded Services:** 45-60 minutes

⏰ **Operating Hours:** 24/7
📍 **Real-time Updates:** You'll receive Discord notifications during delivery!

Need an urgent delivery? Let us know your timeframe!";
    }

    if (input.includes('payment') || input.includes('pay')) {
      return "💳 **Accepted Payment Methods:**

✅ **Primary:** Razorpay (India)
✅ **International:** Stripe
✅ **Digital:** UPI, Crypto
✅ **Traditional:** Credit/Debit Cards

🔒 **Secure Processing:** All payments are PCI DSS compliant
💰 **Price Transparency:** No hidden fees or surprise charges

Want help with a specific payment method?";
    }

    if (input.includes('safety') || input.includes('secure') || input.includes('safe')) {
      return "🛡️ **Your Security is Our Priority:**

🔐 **Encryption:** All credentials encrypted with AES-256
🕵️ **Monitoring:** Real-time activity monitoring
🛡️ **Ban Protection:** 30-day warranty
🔄 **Verification:** Two-factor authentication available

📊 **Security Stats:**
• 99.9% uptime guarantee
• Zero data breaches in 2+ years
• 50,000+ satisfied customers

Your data is completely safe with us!";
    }

    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "👋 Hello! Welcome to GameVault Pro! I'm here to help you with:

• 📦 Order tracking & status
• 🛡️ Warranty & safety questions
• 🔐 2FA backup code help
• 💳 Payment & pricing info
• 📞 Human agent connections

What can I help you with today?";
    }

    if (input.includes('discount') || input.includes('coupon') || input.includes('promo')) {
      return "🎫 **Available Promo Codes:**

🎟️ **WELCOME10:** 10% off your first order
🎟️ **GTA50:** ₹50 off orders above ₹1000
🎟️ **BOOST25:** 25% off premium accounts

📋 **How to use:**
1. Add items to cart
2. Enter code at checkout
3. Save more, game more!

💡 **Pro Tip:** Subscribe for exclusive discounts!";
    }

    return "🤖 **I understand your question!**

Unfortunately, I don't have specific information about that yet. However, I can connect you with a human expert who knows GTA V services inside-out!

**Quick Actions:**
• 📦 Track your order
• 🛡️ Warranty questions  
• 🔐 2FA backup codes
• 🎧 Speak with human

Or tell me more about your specific question and I'll escalate it!";
  };

  return (
    <>
      {/* Chat Widget Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-16 h-16 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-full shadow-2xl hover:shadow-[#8B5CF6]/50 transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4C2.9 2 2 2.9 2 4v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-4H6V8h12v2z"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white">
              <div className="w-full h-full bg-[#10B981] rounded-full animate-pulse"></div>
            </div>
            <div className="absolute -bottom-1 -left-1 bg-black/80 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              24/7 AI Support
            </div>
          </button>
        )}

        {isOpen && (
          <div className="w-96 h-[500px] bg-[#09090B] border border-[#374151] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] p-4 text-white">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold">BoostVerse AI Support</h3>
                    <p className="text-xs opacity-90">Always here to help</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-xs ${message.sender === 'user'
                        ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-2xl rounded-tr-sm'
                        : 'bg-[#18181B] border border-[#374151] text-white rounded-2xl rounded-tl-sm'
                      } p-3 shadow-md
                    }
                  }
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#18181B] border border-[#374151] rounded-2xl rounded-tl-sm p-4 shadow-md">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Order Status Form */}
            {orderStatus.isVisible && (
              <div className="p-4 bg-[#27272A] border-t border-[#374151]">
                <h4 className="text-sm font-semibold mb-3">📦 Order Tracking</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Order ID (e.g., 1234567890)"
                    value={orderStatus.orderId}
                    onChange={(e) => setOrderStatus(prev => ({ ...prev, orderId: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#09090B] border border-[#374151] rounded-lg text-white text-sm focus:border-[#8B5CF6] focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={orderStatus.email}
                    onChange={(e) => setOrderStatus(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#09090B] border border-[#374151] rounded-lg text-white text-sm focus:border-[#8B5CF6] focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (orderStatus.orderId && orderStatus.email) {
                        setMessages(prev => [
                          ...prev,
                          {
                            id: prev.length + 1,
                            text: `🔍 **Checking your order status...**

📋 **Order Details:**
• Order ID: ${orderStatus.orderId}
• Email: ${orderStatus.email}

⏳ Please wait while we fetch your order information...`,
                            sender: 'bot',
                            timestamp: new Date(),
                          },
                        ]);
                        setOrderStatus({ isVisible: false, orderId: '', email: '' });
                        setIsTyping(true);

                        setTimeout(() => {
                          setMessages(prev => [
                            ...prev,
                            {
                              id: prev.length + 1,
                              text: `📦 **Order Status: IN PROGRESS** ✅

🎮 **Service:** GTA 5 Money 30M
🔄 **Current Step:** Agent is logging into your account
⏰ **Estimated Completion:** 15-30 minutes more
📧 **Support:** We've notified our team to prioritize your order

**Next Steps:**
• Your account will be processed within the next 30 minutes
• You'll receive real-time updates via Discord
• Order will be marked as 'Delivered' upon completion

🔗 **Need immediate help?** [Contact Discord Support](https://discord.gg/gamevault-pro)

**Order ID: ${orderStatus.orderId}**`,
                              sender: 'bot',
                              timestamp: new Date(),
                            },
                          ],
                          });
                          setIsTyping(false);
                        }, 2000);
                      } else {
                        alert('Please fill in both Order ID and Email');
                      }
                    }}
                    className="w-full px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Track Order
                  </button>
                </div>
              </div>
            )

            {/* Quick Action Buttons */}
            <div className="p-4 bg-[#27272A] border-t border-[#374151]">
              <p className="text-xs text-[#9CA3AF] mb-3">⚡ Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickAction('track-order')}
                  className="flex items-center gap-2 px-3 py-2 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 text-[#8B5CF6] rounded-lg transition-all text-xs"
                >
                  <span>📦</span>
                  Track My Order
                </button>
                <button
                  onClick={() => handleQuickAction('warranty')}
                  className="flex items-center gap-2 px-3 py-2 bg-[#10B981]/20 hover:bg-[#10B981]/40 text-[#10B981] rounded-lg transition-all text-xs"
                >
                  <span>🛡️</span>
                  Is it 100% Ban-Safe?
                </button>
                <button
                  onClick={() => handleQuickAction('2fa-codes')}
                  className="flex items-center gap-2 px-3 py-2 bg-[#06B6D4]/20 hover:bg-[#06B6D4]/40 text-[#06B6D4] rounded-lg transition-all text-xs"
                >
                  <span>🔐</span>
                  How to get 2FA Backup Codes?
                </button>
                <button
                  onClick={() => handleQuickAction('human-agent')}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg transition-all text-xs"
                >
                  <span>🎧</span>
                  Talk to Human Agent
                </button>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-[#09090B] border-t border-[#374151]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-[#18181B] border border-[#374151] rounded-lg text-white text-sm focus:border-[#8B5CF6] focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors"
                >
                  📤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
