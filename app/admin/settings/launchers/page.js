'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const GAMES_CONFIG = [
  { id: 'gta5', name: 'GTA V', icon: '🚗', color: '#F59E0B' },
  { id: 'valorant', name: 'Valorant', icon: '🔫', color: '#EF4444' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️', color: '#8B5CF6' },
  { id: 'forza', name: 'Forza Horizon', icon: '🏎️', color: '#06B6D4' },
  { id: 'other', name: 'Other Games', icon: '🎮', color: '#6B7280' },
];

const LAUNCHERS = {
  gta5: ['Steam', 'Epic Games', 'Rockstar Launcher'],
  valorant: ['Riot Client'],
  fortnite: ['Epic Games'],
  forza: ['Xbox App', 'Steam'],
  other: ['Steam', 'Epic Games', 'Other'],
};

const STATUS_CONFIG = {
  active: { label: 'ACTIVE', color: '#10B981', bg: '#10B98120', icon: '🟢' },
  inactive: { label: 'INACTIVE / MAINTENANCE', color: '#EF4444', bg: '#EF444420', icon: '🔴' },
  coming_soon: { label: 'COMING SOON', color: '#F59E0B', bg: '#F59E0B20', icon: '🟡' },
};

export default function LauncherSettingsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [settings, setSettings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const authResponse = await fetch('/api/admin/me');
      if (!authResponse.ok) {
        router.replace('/admin/login');
        return;
      }
      setCheckingAuth(false);
      loadSettings();
    }
    checkAuth();
  }, [router]);

  const loadSettings = async () => {
    const response = await fetch('/api/admin/launchers');
    if (response.ok) {
      const data = await response.json();
      setSettings(data.settings || []);
    }
  };

  const updateLauncherStatus = async (gameId, launcherName, newStatus) => {
    setSaving(true);
    setStatus('');

    try {
      const response = await fetch('/api/admin/launchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, launcherName, status: newStatus }),
      });

      if (response.ok) {
        setSettings((prev) => {
          const existing = prev.find((s) => s.game_id === gameId && s.launcher_name === launcherName);
          if (existing) {
            return prev.map((s) => s.game_id === gameId && s.launcher_name === launcherName ? { ...s, status: newStatus } : s);
          }
          return [...prev, { game_id: gameId, launcher_name: launcherName, status: newStatus }];
        });
        setStatus(`Updated ${launcherName} to ${newStatus}`);
      } else {
        const result = await response.json();
        setStatus(result.message || 'Failed to update launcher.');
      }
    } catch (error) {
      setStatus('An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const getLauncherStatus = (gameId, launcherName) => {
    const setting = settings.find((s) => s.game_id === gameId && s.launcher_name === launcherName);
    return setting?.status || 'inactive';
  };

  if (checkingAuth) {
    return <main className="admin-shell"><p>Checking admin access...</p></main>;
  }

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div>
          <span className="eyebrow">Launcher Management</span>
          <h1>Dynamic Launcher Controls</h1>
        </div>
        <div className="admin-hero-actions">
          <a className="secondary-btn" href="/admin">Back to Admin</a>
        </div>
      </section>

      {status && (
        <div className="bg-[#10B98120] border border-[#10B98150] rounded-lg p-4 mb-6">
          <p className="text-[#10B981]">{status}</p>
        </div>
      )}

      <section className="space-y-6">
        {GAMES_CONFIG.map((game) => (
          <article key={game.id} className="admin-card">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{game.icon}</span>
              <h2 className="text-xl font-bold">{game.name}</h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: game.color + '20', color: game.color }}>
                {LAUNCHERS[game.id]?.length || 0} Launchers
              </span>
            </div>

            <div className="space-y-4">
              {(LAUNCHERS[game.id] || []).map((launcher) => {
                const currentStatus = getLauncherStatus(game.id, launcher);
                const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.inactive;

                return (
                  <div key={launcher} className="flex items-center justify-between p-4 bg-[#27272A] rounded-lg border border-[#374151]">
                    <div className="flex items-center gap-4">
                      <span className="text-lg">{statusConfig.icon}</span>
                      <div>
                        <h3 className="font-semibold">{launcher}</h3>
                        <p className="text-sm text-[#9CA3AF]">
                          {currentStatus === 'active' ? 'Available for orders' : currentStatus === 'coming_soon' ? 'Coming soon' : 'Under maintenance'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
                        {statusConfig.label}
                      </span>

                      <div className="flex gap-2">
                        <button
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${currentStatus === 'active' ? 'bg-[#10B981] text-white' : 'bg-[#27272A] text-[#9CA3AF] hover:bg-[#10B981]/20 hover:text-[#10B981]'}`}
                          onClick={() => updateLauncherStatus(game.id, launcher, 'active')}
                          disabled={saving}
                        >
                          🟢 Activate
                        </button>
                        <button
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${currentStatus === 'inactive' ? 'bg-[#EF4444] text-white' : 'bg-[#27272A] text-[#9CA3AF] hover:bg-[#EF4444]/20 hover:text-[#EF4444]'}`}
                          onClick={() => updateLauncherStatus(game.id, launcher, 'inactive')}
                          disabled={saving}
                        >
                          🔴 Deactivate
                        </button>
                        <button
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${currentStatus === 'coming_soon' ? 'bg-[#F59E0B] text-white' : 'bg-[#27272A] text-[#9CA3AF] hover:bg-[#F59E0B]/20 hover:text-[#F59E0B]'}`}
                          onClick={() => updateLauncherStatus(game.id, launcher, 'coming_soon')}
                          disabled={saving}
                        >
                          🟡 Coming Soon
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
