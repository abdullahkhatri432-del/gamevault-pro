import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#18181B] border border-[#374151] rounded-xl p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-4">Page not found</h1>
          <p className="text-[#9CA3AF] mb-6">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors font-medium inline-block"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
