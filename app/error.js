'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#18181B] border border-[#374151] rounded-xl p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-[#9CA3AF] mb-6">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors font-medium"
          >
            Try again
          </button>
          <a
            href="/"
            className="ml-4 px-6 py-3 bg-[#27272A] hover:bg-[#374151] rounded-lg transition-colors font-medium inline-block"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
