'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrderSuccess() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const storedOrder = localStorage.getItem('gvp_lastOrder');
    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-[#9CA3AF] mb-6">
            Your order has been placed successfully. Your booster will be assigned shortly.
          </p>
          {order && (
            <div className="text-left bg-[#121215] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#9CA3AF] mb-2">Order Details:</p>
              <p><strong>Game:</strong> {order.gameId}</p>
              <p><strong>Launcher:</strong> {order.launcher}</p>
              {order.serviceType.includes('login') && order.accountPassword && (
                <p className="text-xs text-yellow-400 mt-2">⚠️ Credentials saved securely for delivery</p>
              )}
            </div>
          )}
          <Link href="/dashboard" className="primary-btn block w-full mb-3">View in Dashboard</Link>
          <Link href="/" className="ghost-btn block w-full">Back to Store</Link>
        </div>
      </div>
    </main>
  );
}
