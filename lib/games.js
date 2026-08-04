export const SERVICE_BADGES = {
  no_login: {
    id: 'no_login',
    label: 'NO LOGIN NEEDED',
    icon: '🛡️',
    color: '#10B981',
    bgColor: '#10B98120',
    description: 'Only Gamertag/Social Club Username needed to join session',
    requiresCredentials: false,
  },
  login_required: {
    id: 'login_required',
    label: 'LOGIN REQUIRED',
    icon: '🔑',
    color: '#F59E0B',
    bgColor: '#F59E0B20',
    description: 'Requires temporary account credentials for direct injection. Protected by 30-Day Anti-Ban Warranty.',
    requiresCredentials: true,
  },
  instant_delivery: {
    id: 'instant_delivery',
    label: 'INSTANT DELIVERY',
    icon: '⚡',
    color: '#8B5CF6',
    bgColor: '#8B5CF620',
    description: 'Credentials delivered post-payment. No customer account login required.',
    requiresCredentials: false,
  },
};

export const LAUNCHER_STATUS = {
  active: { id: 'active', label: 'ACTIVE', color: '#10B981', icon: '🟢' },
  inactive: { id: 'inactive', label: 'INACTIVE / MAINTENANCE', color: '#EF4444', icon: '🔴' },
  coming_soon: { id: 'coming_soon', label: 'COMING SOON', color: '#F59E0B', icon: '🟡' },
};

export const GAMES = {
  gta5: {
    id: 'gta5',
    name: 'GTA V',
    slug: 'gta-v',
    color: '#F59E0B',
    icon: '🚗',
    launchers: [
      { name: 'Steam', status: 'active' },
      { name: 'Epic Games', status: 'inactive' },
      { name: 'Rockstar Launcher', status: 'inactive' },
    ],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    serviceTypes: [
      { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and deliver services on your account' },
      { id: 'lobby_carry', label: 'In-Game Lobby / Carry', badge: 'no_login', description: 'Join a hosted session for money or RP gains' },
      { id: 'premade_account', label: 'Premade Account', badge: 'instant_delivery', description: 'Receive a ready-to-play account with progress' },
    ],
    categories: ['In-game currency', 'Level boost', 'Upgrade', 'Modded cars', 'Modded accounts', 'Custom services'],
    deliveryMethods: ['Account login', 'Session invite', 'Account transfer'],
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    slug: 'valorant',
    color: '#EF4444',
    icon: '🔫',
    launchers: [
      { name: 'Riot Client', status: 'active' },
    ],
    platforms: ['PC'],
    serviceTypes: [
      { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and rank up your account' },
      { id: 'boosting', label: 'Rank Boosting', badge: 'login_required', description: 'We play on your account to reach target rank' },
      { id: 'premade_account', label: 'Premade Account', badge: 'instant_delivery', description: 'Receive an account with desired rank and skins' },
    ],
    categories: ['Rank boost', 'Agent unlock', 'Skin unlock', 'Premade accounts', 'Custom services'],
    deliveryMethods: ['Account login', 'Duo boost'],
  },
  fortnite: {
    id: 'fortnite',
    name: 'Fortnite',
    slug: 'fortnite',
    color: '#8B5CF6',
    icon: '🏗️',
    launchers: [
      { name: 'Epic Games', status: 'active' },
    ],
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
    serviceTypes: [
      { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and complete challenges on your account' },
      { id: 'lobby_carry', label: 'Carry / Lobby', badge: 'no_login', description: 'Squad carry for wins and XP' },
      { id: 'premade_account', label: 'Premade Account', badge: 'instant_delivery', description: 'Receive an account with skins and V-Bucks' },
    ],
    categories: ['V-Bucks', 'Level boost', 'Skin unlock', 'Win boost', 'Premade accounts'],
    deliveryMethods: ['Account login', 'Squad invite', 'Account transfer'],
  },
  forza: {
    id: 'forza',
    name: 'Forza Horizon',
    slug: 'forza-horizon',
    color: '#06B6D4',
    icon: '🏎️',
    launchers: [
      { name: 'Xbox App', status: 'active' },
      { name: 'Steam', status: 'active' },
    ],
    platforms: ['PC', 'Xbox'],
    serviceTypes: [
      { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and unlock cars and credits' },
      { id: 'lobby_carry', label: 'Session Service', badge: 'no_login', description: 'Join a session for credits and car delivery' },
      { id: 'premade_account', label: 'Premade Account', badge: 'instant_delivery', description: 'Receive an account with garage and credits' },
    ],
    categories: ['Credits', 'Car unlock', 'Garage build', 'Premade accounts'],
    deliveryMethods: ['Account login', 'Session invite'],
  },
  other: {
    id: 'other',
    name: 'Other Games',
    slug: 'other',
    color: '#6B7280',
    icon: '🎮',
    launchers: [
      { name: 'Steam', status: 'active' },
      { name: 'Epic Games', status: 'inactive' },
      { name: 'Other', status: 'active' },
    ],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    serviceTypes: [
      { id: 'account_recovery', label: 'Account Recovery', badge: 'login_required', description: 'We log in and deliver services on your account' },
      { id: 'boosting', label: 'Boosting', badge: 'login_required', description: 'We play on your account to achieve goals' },
      { id: 'premade_account', label: 'Premade Account', badge: 'instant_delivery', description: 'Receive a ready-to-play account' },
    ],
    categories: ['General services', 'Premade accounts', 'Custom services'],
    deliveryMethods: ['Account login', 'Session invite', 'Account transfer'],
  },
};

export const GAME_LIST = Object.values(GAMES);

export function getGameById(id) {
  return GAMES[id] || null;
}

export function getGameBySlug(slug) {
  return GAME_LIST.find((game) => game.slug === slug) || null;
}

export function getGamesArray() {
  return GAME_LIST;
}

export function getGameLaunchers(gameId) {
  const game = GAMES[gameId];
  return game ? game.launchers : [];
}

export function getActiveLaunchers(gameId) {
  const game = GAMES[gameId];
  return game ? game.launchers.filter((l) => l.status === 'active') : [];
}

export function getGameServiceTypes(gameId) {
  const game = GAMES[gameId];
  return game ? game.serviceTypes : [];
}

export function getGameCategories(gameId) {
  const game = GAMES[gameId];
  return game ? game.categories : [];
}

export function getServiceBadge(badgeId) {
  return SERVICE_BADGES[badgeId] || SERVICE_BADGES.login_required;
}

export function getLauncherStatus(launcherName, gameId) {
  const game = GAMES[gameId];
  if (!game) return LAUNCHER_STATUS.inactive;
  const launcher = game.launchers.find((l) => l.name === launcherName);
  return launcher ? LAUNCHER_STATUS[launcher.status] : LAUNCHER_STATUS.inactive;
}
