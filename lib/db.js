import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const dbDirectory = path.join(process.cwd(), 'data');
const dbFile = path.join(dbDirectory, 'gamevault.db');

if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isLockedError(error) {
  return error?.errcode === 5 || /locked|busy/i.test(String(error?.message || ''));
}

function initializeDatabase() {
  const db = new DatabaseSync(dbFile);
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA journal_mode = WAL');
  return db;
}

function openDatabaseWithRetry() {
  let lastError = null;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const db = initializeDatabase();
      runSchemaAndSeeds(db);
      return db;
    } catch (error) {
      lastError = error;
      if (!isLockedError(error)) {
        throw error;
      }
      sleepSync(150);
    }
  }

  throw lastError;
}

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const remaining = end - Date.now();
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(remaining, 50));
  }
}

function runSchemaAndSeeds(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE,
      price TEXT NOT NULL,
      tag TEXT NOT NULL,
      rating TEXT NOT NULL,
      stock TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Game',
      game_id TEXT NOT NULL DEFAULT 'gta5',
      image_url TEXT,
      description TEXT NOT NULL DEFAULT '',
      platform TEXT NOT NULL DEFAULT 'PC',
      launcher TEXT NOT NULL DEFAULT 'Steam',
      requirements TEXT NOT NULL DEFAULT '',
      delivery_time TEXT NOT NULL DEFAULT '2-4 hrs',
      warranty_days INTEGER NOT NULL DEFAULT 30,
      original_price TEXT NOT NULL DEFAULT '',
      service_status TEXT NOT NULL DEFAULT 'active',
      fulfillment_method TEXT NOT NULL DEFAULT 'account_login',
      important_notes TEXT NOT NULL DEFAULT '',
      supported_regions TEXT NOT NULL DEFAULT '',
      availability TEXT NOT NULL DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      comment TEXT NOT NULL,
      rating TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS reviews_unique_seed
    ON reviews (name, comment, rating);

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      google_id TEXT UNIQUE,
      password_hash TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      game TEXT NOT NULL,
      launcher TEXT NOT NULL DEFAULT '',
      launcher_id TEXT,
      account_id TEXT,
      account_password TEXT,
      note TEXT,
      amount_paise INTEGER NOT NULL DEFAULT 0,
      coupon_code TEXT,
      discount_paise INTEGER NOT NULL DEFAULT 0,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      -- New fields for enhanced GTA V service platform
      platform_type TEXT,
      discord_username TEXT,
      whatsapp_phone TEXT,
      service_type TEXT NOT NULL DEFAULT 'account_recovery',
      twofa_backup_code TEXT,
      delivery_eta TEXT,
      otp_code TEXT,
      otp_expiry TEXT,
      fulfillment_agent_id TEXT,
      fulfillment_started_at TEXT,
      discord_webhook_id TEXT,
      sensitive_data_purged INTEGER NOT NULL DEFAULT 0,
      delivery_proof TEXT,
      game_id TEXT NOT NULL DEFAULT 'gta5'
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL DEFAULT 'percent',
      discount_value REAL NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      max_uses INTEGER NOT NULL DEFAULT 0,
      used_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      booster_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      order_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message TEXT NOT NULL,
      flagged INTEGER NOT NULL DEFAULT 0,
      flag_reason TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS boosters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      whatsapp TEXT,
      discord_tag TEXT,
      id_document_url TEXT,
      selfie_url TEXT,
      social_proof TEXT,
      upi_id TEXT,
      bank_details TEXT,
      crypto_wallet TEXT,
      supported_games TEXT,
      supported_launchers TEXT,
      supported_platforms TEXT,
      supported_service_types TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      escrow_hold_days INTEGER NOT NULL DEFAULT 14,
      security_deposit INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS escrow_payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      booster_id TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'held',
      held_until TEXT NOT NULL,
      released_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      launcher_name TEXT NOT NULL,
      email TEXT NOT NULL,
      discord_username TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS anomaly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      reporter_email TEXT NOT NULL,
      report_type TEXT NOT NULL DEFAULT 'order_discrepancy',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS launcher_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      launcher_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(game_id, launcher_name)
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'normal',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

const productColumns = db.prepare('PRAGMA table_info(products)').all();
const existingProductColumns = new Set(productColumns.map((column) => column.name));
const missingProductColumns = [
  ['category', 'TEXT NOT NULL DEFAULT "Game"'],
  ['game_id', 'TEXT NOT NULL DEFAULT "gta5"'],
  ['image_url', 'TEXT'],
  ['description', 'TEXT NOT NULL DEFAULT ""'],
];

for (const [columnName, columnDefinition] of missingProductColumns) {
  if (!existingProductColumns.has(columnName)) {
    try {
      db.exec(`ALTER TABLE products ADD COLUMN ${columnName} ${columnDefinition}`);
    } catch (e) {
      if (!/duplicate column/i.test(String(e?.message || ''))) {
        throw e;
      }
    }
  }
}

const missingCatalogColumns = [
  ['platform', 'TEXT NOT NULL DEFAULT "PC"'],
  ['launcher', 'TEXT NOT NULL DEFAULT "Steam"'],
  ['requirements', 'TEXT NOT NULL DEFAULT ""'],
  ['delivery_time', 'TEXT NOT NULL DEFAULT "2-4 hrs"'],
  ['warranty_days', 'INTEGER NOT NULL DEFAULT 30'],
  ['original_price', 'TEXT NOT NULL DEFAULT ""'],
  ['service_status', 'TEXT NOT NULL DEFAULT "active"'],
  ['fulfillment_method', 'TEXT NOT NULL DEFAULT "account_login"'],
  ['important_notes', 'TEXT NOT NULL DEFAULT ""'],
  ['supported_regions', 'TEXT NOT NULL DEFAULT ""'],
  ['availability', 'TEXT NOT NULL DEFAULT "available"'],
];

for (const [columnName, columnDefinition] of missingCatalogColumns) {
  if (!existingProductColumns.has(columnName)) {
    try {
      db.exec(`ALTER TABLE products ADD COLUMN ${columnName} ${columnDefinition}`);
    } catch (e) {
      if (!/duplicate column/i.test(String(e?.message || ''))) {
        throw e;
      }
    }
  }
}

const orderColumns = db.prepare('PRAGMA table_info(orders)').all();
const existingOrderColumns = new Set(orderColumns.map((column) => column.name));
const missingOrderColumns = [
  ['launcher', 'TEXT NOT NULL DEFAULT ""'],
  ['launcher_id', 'TEXT'],
  ['account_id', 'TEXT'],
  ['account_password', 'TEXT'],
  ['amount_paise', 'INTEGER NOT NULL DEFAULT 0'],
  ['coupon_code', 'TEXT'],
  ['discount_paise', 'INTEGER NOT NULL DEFAULT 0'],
  ['razorpay_order_id', 'TEXT'],
  ['razorpay_payment_id', 'TEXT'],
  ['platform_type', 'TEXT'],
  ['discord_username', 'TEXT'],
  ['whatsapp_phone', 'TEXT'],
  ['service_type', 'TEXT NOT NULL DEFAULT "account_recovery"'],
  ['twofa_backup_code', 'TEXT'],
  ['delivery_eta', 'TEXT'],
  ['otp_code', 'TEXT'],
  ['otp_expiry', 'TEXT'],
  ['fulfillment_agent_id', 'TEXT'],
  ['fulfillment_started_at', 'TEXT'],
  ['discord_webhook_id', 'TEXT'],
  ['sensitive_data_purged', 'INTEGER NOT NULL DEFAULT 0'],
  ['delivery_proof', 'TEXT'],
  ['game_id', 'TEXT NOT NULL DEFAULT "gta5"'],
];

for (const [columnName, columnDefinition] of missingOrderColumns) {
  if (!existingOrderColumns.has(columnName)) {
    try {
      db.exec(`ALTER TABLE orders ADD COLUMN ${columnName} ${columnDefinition}`);
    } catch (e) {
      if (!/duplicate column/i.test(String(e?.message || ''))) {
        throw e;
      }
    }
  }
}

const userColumns = db.prepare('PRAGMA table_info(users)').all();
const existingUserColumns = new Set(userColumns.map((column) => column.name));
if (!existingUserColumns.has('google_id')) {
  try {
    db.exec('ALTER TABLE users ADD COLUMN google_id TEXT');
  } catch (e) {
    if (!/duplicate column/i.test(String(e?.message || ''))) {
      throw e;
    }
  }
}

const seedProducts = [
  {
    title: 'GTA 5 Money 30M',
    price: '₹2,499',
    tag: 'GTA Online cash injection',
    rating: '4.9',
    stock: 'In stock',
    category: 'In-game currency',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80',
    description: '30 million GTA dollars delivered to your Rockstar account. Pick Steam or Epic during checkout.',
    platform: 'PC, PS5, Xbox',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Your Rockstar Social Club login or gamertag',
    delivery_time: '30-60 min',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Do not log into the account during delivery. Change password after completion.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Money 100M',
    price: '₹6,999',
    tag: 'Best value bundle',
    rating: '4.8',
    stock: 'In stock',
    category: 'In-game currency',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: '100 million GTA dollars on your account. Safe drop method, launcher selection at checkout.',
    platform: 'PC, PS5, Xbox',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Your Rockstar Social Club login or gamertag',
    delivery_time: '30-60 min',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Do not log into the account during delivery. Change password after completion.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Money 250M',
    price: '₹14,999',
    tag: 'High-roller pack',
    rating: '4.8',
    stock: 'In stock',
    category: 'In-game currency',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: '250 million GTA dollars in one drop. The biggest money bundle for whales.',
    platform: 'PC, PS5, Xbox',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Your Rockstar Social Club login or gamertag',
    delivery_time: '30-60 min',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Do not log into the account during delivery. Change password after completion.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Level Boost 1-50',
    price: '₹499',
    tag: 'Starter level boost',
    rating: '4.7',
    stock: 'In stock',
    category: 'Level boost',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
    description: 'We push your character to level 50 with clean RP grinding on your account.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '2-4 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Avoid logging in during the boost process.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Level Boost 1-120',
    price: '₹1,299',
    tag: 'Popular level boost',
    rating: '4.8',
    stock: 'In stock',
    category: 'Level boost',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80',
    description: 'Reach level 120 fast. Unlocks everything most players grind months for.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '2-4 hrs',
    warranty_days: 30,
    original_price: '₹1,599',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Avoid logging in during the boost process.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Level Boost 1-500',
    price: '₹4,999',
    tag: 'High level grind skip',
    rating: '4.9',
    stock: 'In stock',
    category: 'Level boost',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'Skipping to level 500. Premium RP service with priority delivery.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '4-8 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Avoid logging in during the boost process. Priority queue.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Level Boost 1-800',
    price: '₹7,999',
    tag: 'Max level service',
    rating: '4.9',
    stock: 'In stock',
    category: 'Level boost',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=700&q=80',
    description: 'Maximum level 800. The ultimate account upgrade, delivered securely.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '8-12 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Longest delivery window. Avoid logging in during boost.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Unlock All',
    price: '₹1,499',
    tag: 'Cars, weapons, properties',
    rating: '4.7',
    stock: 'In stock',
    category: 'Upgrade',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'Unlocks vehicles, weapons, and properties on your account.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '1-2 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'All unlocks applied in a single session.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Business Max Upgrade',
    price: '₹2,999',
    tag: 'Full business setup',
    rating: '4.8',
    stock: 'In stock',
    category: 'Upgrade',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80',
    description: 'Complete business setup with all upgrades so your money keeps rolling in.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '2-4 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'All businesses fully upgraded in one session.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Heist + Stats Reset',
    price: '₹999',
    tag: 'RP, stats, and heist progress reset',
    rating: '4.6',
    stock: 'In stock',
    category: 'Upgrade',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
    description: 'Fresh start package: resets RP, stats, and heist progress cleanly.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '1-2 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'This is a irreversible reset. Make sure you want a fresh start.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Custom Heist Setup (Cayo Perico)',
    price: '₹1,799',
    tag: 'Cayo Perico prepped',
    rating: '4.9',
    stock: 'In stock',
    category: 'Upgrade',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'Full Cayo Perico heist setup on your account so you can run it whenever you want.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '1-2 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Heist prep completed. You can run the finale anytime.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Custom Heist Setup (Casino)',
    price: '₹1,599',
    tag: 'Casino heist prepped',
    rating: '4.8',
    stock: 'In stock',
    category: 'Upgrade',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80',
    description: 'Complete Casino heist setup with your preferred approach unlocked.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '1-2 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Choose your approach: Aggressive, Silent & Sneaky, or Big Con.',
    supported_regions: 'Global',
  },
  {
    title: 'Modded Cars Starter Pack',
    price: '₹999',
    tag: '5 modded cars',
    rating: '4.7',
    stock: 'In stock',
    category: 'Modded cars',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80',
    description: 'Five modded cars delivered to your garage with custom paint and upgrades.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: 'Same session',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Cars delivered to your in-game garage. Requires free garage slots.',
    supported_regions: 'Global',
  },
  {
    title: 'Modded Cars Power Pack',
    price: '₹2,499',
    tag: '12 modded cars',
    rating: '4.8',
    stock: 'In stock',
    category: 'Modded cars',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80',
    description: 'Twelve modded cars, maxed out with performance upgrades and rare colors.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: 'Same session',
    warranty_days: 30,
    original_price: '₹2,999',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Cars delivered to your in-game garage. Requires free garage slots.',
    supported_regions: 'Global',
  },
  {
    title: 'Modded Cars Booster Pack',
    price: '₹4,499',
    tag: '25 modded cars',
    rating: '4.9',
    stock: 'In stock',
    category: 'Modded cars',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80',
    description: 'Twenty-five modded cars including top-tier supercars, fully upgraded.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: 'Same session',
    warranty_days: 30,
    original_price: '₹5,499',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Cars delivered to your in-game garage. Requires free garage slots.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 Premium Account (Full Access)',
    price: '₹9,999',
    tag: 'Premium modded account',
    rating: '4.9',
    stock: 'Limited stock',
    category: 'Modded accounts',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'Full premium GTA 5 account with max cash, all unlocks, modded cars, and exclusive properties.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'No login needed — account credentials delivered after payment',
    delivery_time: 'Instant',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'instant_delivery',
    important_notes: 'You receive a fresh account. Do not link your personal Social Club email.',
    supported_regions: 'Global',
  },
  {
    title: 'GTA 5 100M + Level 120 + All Unlocks',
    price: '₹12,999',
    tag: 'Ultimate service bundle',
    rating: '5.0',
    stock: 'Limited stock',
    category: 'Custom services',
    game_id: 'gta5',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80',
    description: 'Complete package: 100M cash, level 120 boost, all game unlocks, and modded car collection.',
    platform: 'PC',
    launcher: 'Steam, Epic Games, Rockstar Launcher',
    requirements: 'Account credentials for login-based service',
    delivery_time: '4-8 hrs',
    warranty_days: 30,
    original_price: '₹15,999',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Most comprehensive bundle. Avoid logging in during delivery.',
    supported_regions: 'Global',
  },
  {
    title: 'Valorant Iron to Gold Boost',
    price: '₹1,999',
    tag: 'Rank climbing service',
    rating: '4.8',
    stock: 'In stock',
    category: 'Rank boost',
    game_id: 'valorant',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'We boost your account from Iron to Gold rank. Safe methods, manual play only.',
    platform: 'PC',
    launcher: 'Riot Client',
    requirements: 'Riot account credentials (email + password)',
    delivery_time: '2-4 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Do not queue competitive matches during boost. Manual play only — no scripts.',
    supported_regions: 'Global',
  },
  {
    title: 'Valorant Diamond to Immortal',
    price: '₹5,999',
    tag: 'High-elo boost',
    rating: '4.9',
    stock: 'Limited stock',
    category: 'Rank boost',
    game_id: 'valorant',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'Premium high-elo boost from Diamond to Immortal. Experienced immortals only.',
    platform: 'PC',
    launcher: 'Riot Client',
    requirements: 'Riot account credentials (email + password)',
    delivery_time: '4-8 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'High-elo only. Played by top-tier immortals. Do not queue during boost.',
    supported_regions: 'Global',
  },
  {
    title: 'Fortnite V-Bucks 5000',
    price: '₹3,499',
    tag: 'V-Bucks delivery',
    rating: '4.7',
    stock: 'In stock',
    category: 'V-Bucks',
    game_id: 'fortnite',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: '5000 V-Bucks delivered to your Epic Games account. Fast and secure.',
    platform: 'PC, PS5, Xbox, Nintendo Switch',
    launcher: 'Epic Games',
    requirements: 'Epic Games account email',
    delivery_time: '30-60 min',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'session_invite',
    important_notes: 'Join our lobby to receive V-Bucks. Must be online at delivery time.',
    supported_regions: 'Global',
  },
  {
    title: 'Fortnite Level 100 Battle Pass',
    price: '₹2,499',
    tag: 'Full battle pass completion',
    rating: '4.8',
    stock: 'In stock',
    category: 'Level boost',
    game_id: 'fortnite',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'Complete battle pass to level 100. All skins and rewards unlocked.',
    platform: 'PC, PS5, Xbox, Nintendo Switch',
    launcher: 'Epic Games',
    requirements: 'Epic Games account credentials',
    delivery_time: '4-8 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Do not log in during delivery. All battle pass rewards will be unlocked.',
    supported_regions: 'Global',
  },
  {
    title: 'Forza Horizon 50M Credits',
    price: '₹2,999',
    tag: 'Credits injection',
    rating: '4.8',
    stock: 'In stock',
    category: 'Credits',
    game_id: 'forza',
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80',
    description: '50 million credits for Forza Horizon. Buy any car you want.',
    platform: 'PC, Xbox',
    launcher: 'Xbox App, Steam',
    requirements: 'Xbox or Steam account credentials',
    delivery_time: '1-2 hrs',
    warranty_days: 30,
    original_price: '',
    service_status: 'active',
    fulfillment_method: 'account_login',
    important_notes: 'Credits injected via in-game methods. Do not log in during delivery.',
    supported_regions: 'Global',
  },
];

const seedReviews = [
  {
    name: 'Aarav',
    comment: 'Fast delivery and super clean account setup.',
    rating: '5.0',
  },
  {
    name: 'Lina',
    comment: 'Loved the smooth checkout and modern design.',
    rating: '4.9',
  },
  {
    name: 'Nico',
    comment: 'The order process felt secure and simple.',
    rating: '4.8',
  },
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (title, price, tag, rating, stock, category, game_id, image_url, description, platform, launcher, requirements, delivery_time, warranty_days, original_price, service_status, fulfillment_method, important_notes, supported_regions, availability)
  VALUES (@title, @price, @tag, @rating, @stock, @category, @game_id, @image_url, @description, @platform, @launcher, @requirements, @delivery_time, @warranty_days, @original_price, @service_status, @fulfillment_method, @important_notes, @supported_regions, @availability)
`);

const insertReview = db.prepare(`
  INSERT OR IGNORE INTO reviews (name, comment, rating)
  VALUES (@name, @comment, @rating)
`);

const insertCoupon = db.prepare(`
  INSERT OR IGNORE INTO coupons (code, discount_type, discount_value, active, max_uses, used_count, expires_at)
  VALUES (@code, @discount_type, @discount_value, @active, @max_uses, @used_count, @expires_at)
`);

const seedCoupons = [
  {
    code: 'WELCOME10',
    discount_type: 'percent',
    discount_value: 10,
    active: 1,
    max_uses: 0,
    used_count: 0,
    expires_at: null,
  },
  {
    code: 'GTA50',
    discount_type: 'fixed',
    discount_value: 50,
    active: 1,
    max_uses: 100,
    used_count: 0,
    expires_at: null,
  },
];

for (const product of seedProducts) {
  insertProduct.run(product);
}

for (const review of seedReviews) {
  insertReview.run(review);
}

for (const coupon of seedCoupons) {
  insertCoupon.run(coupon);
}
}

const db = openDatabaseWithRetry();

export function getDb() {
  return db;
}
