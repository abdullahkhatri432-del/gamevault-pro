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
  other: ['Steam', 'Epic Games'],
};

const LAUNCHER_ICONS = {
  Steam: '⚙️',
  'Epic Games': '🎮',
  'Rockstar Launcher': '🏍️',
  'Riot Client': '🔫',
  'Xbox App': '🎮',
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10B981', icon: '✅' },
  inactive: { label: 'Maintenance', color: '#EF4444', icon: '🔴' },
  coming_soon: { label: 'Coming Soon', color: '#F59E0B', icon: '🟡' },
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
          <p className="admin-hero-sub">Manage launcher availability for each game. Changes reflect instantly on the order page.</p>
        </div>
        <div className="admin-hero-actions">
          <a className="secondary-btn" href="/admin">← Back to Admin</a>
        </div>
      </section>

      {status && (
        <div className="status-banner">
          <span>{status}</span>
          <button onClick={() => setStatus('')} className="status-close">×</button>
        </div>
      )}

      <section className="launcher-admin-grid">
        {GAMES_CONFIG.map((game) => {
          const gameLaunchers = LAUNCHERS[game.id] || [];
          const activeCount = gameLaunchers.filter(l => getLauncherStatus(game.id, l) === 'active').length;

          return (
            <article key={game.id} className="launcher-admin-card">
              <div className="launcher-admin-header" style={{ borderColor: game.color + '40' }}>
                <div className="launcher-admin-game">
                  <span className="launcher-admin-icon">{game.icon}</span>
                  <div>
                    <h2 className="launcher-admin-title">{game.name}</h2>
                    <span className="launcher-admin-count">{activeCount}/{gameLaunchers.length} active</span>
                  </div>
                </div>
                <span className="launcher-admin-badge" style={{ backgroundColor: game.color + '20', color: game.color }}>
                  {gameLaunchers.length} Launchers
                </span>
              </div>

              <div className="launcher-admin-list">
                {gameLaunchers.map((launcher) => {
                  const currentStatus = getLauncherStatus(game.id, launcher);
                  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.inactive;
                  const launcherIcon = LAUNCHER_ICONS[launcher] || '🎮';

                  return (
                    <div key={launcher} className={`launcher-admin-item ${currentStatus}`}>
                      <div className="launcher-admin-item-info">
                        <span className="launcher-admin-item-icon">{launcherIcon}</span>
                        <div className="launcher-admin-item-details">
                          <h3 className="launcher-admin-item-name">{launcher}</h3>
                          <span className="launcher-admin-item-desc">
                            {currentStatus === 'active' && 'Available for orders'}
                            {currentStatus === 'coming_soon' && 'Coming soon to the platform'}
                            {currentStatus === 'inactive' && 'Under safety maintenance'}
                          </span>
                        </div>
                        <span className="launcher-admin-status-dot" style={{ backgroundColor: statusConfig.color }} title={statusConfig.label}></span>
                      </div>

                      <div className="launcher-admin-actions">
                        <button
                          className={`launcher-admin-btn ${currentStatus === 'active' ? 'active' : ''}`}
                          onClick={() => updateLauncherStatus(game.id, launcher, 'active')}
                          disabled={saving || currentStatus === 'active'}
                        >
                          <span>✅</span> Activate
                        </button>
                        <button
                          className={`launcher-admin-btn ${currentStatus === 'inactive' ? 'inactive' : ''}`}
                          onClick={() => updateLauncherStatus(game.id, launcher, 'inactive')}
                          disabled={saving || currentStatus === 'inactive'}
                        >
                          <span>🔴</span> Maintenance
                        </button>
                        <button
                          className={`launcher-admin-btn ${currentStatus === 'coming_soon' ? 'coming-soon' : ''}`}
                          onClick={() => updateLauncherStatus(game.id, launcher, 'coming_soon')}
                          disabled={saving || currentStatus === 'coming_soon'}
                        >
                          <span>🟡</span> Coming Soon
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
