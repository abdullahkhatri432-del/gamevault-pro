export default function Loading() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
        <p className="mt-4 text-[#9CA3AF]">Loading...</p>
      </div>
    </main>
  );
}
