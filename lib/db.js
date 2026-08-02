import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDirectory = path.join(process.cwd(), 'data');
const dbFile = path.join(dbDirectory, 'gamevault.db');

if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    price TEXT NOT NULL,
    tag TEXT NOT NULL,
    rating TEXT NOT NULL,
    stock TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Game',
    image_url TEXT,
    description TEXT NOT NULL DEFAULT ''
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
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    game TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const productColumns = db.prepare('PRAGMA table_info(products)').all();
const existingProductColumns = new Set(productColumns.map((column) => column.name));
const missingProductColumns = [
  ['category', 'TEXT NOT NULL DEFAULT \"Game\"'],
  ['image_url', 'TEXT'],
  ['description', 'TEXT NOT NULL DEFAULT \"\"'],
];

for (const [columnName, columnDefinition] of missingProductColumns) {
  if (!existingProductColumns.has(columnName)) {
    db.exec(`ALTER TABLE products ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

const orderColumns = db.prepare('PRAGMA table_info(orders)').all();
const existingOrderColumns = new Set(orderColumns.map((column) => column.name));
if (!existingOrderColumns.has('status')) {
  db.exec('ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT \"pending\"');
}

const seedProducts = [
  {
    title: 'Valorant Prime',
    price: '$18',
    tag: 'Legendary skin bundle',
    rating: '4.9',
    stock: '12 left',
    category: 'FPS',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'Premium Valorant account with rank-ready upgrades and secure login details.',
  },
  {
    title: 'Fortnite OG',
    price: '$12',
    tag: 'Battle pass included',
    rating: '4.8',
    stock: '8 left',
    category: 'Battle Royale',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80',
    description: 'Fortnite account with exclusive cosmetics and a fully prepared battle pass.',
  },
  {
    title: 'EA FC Elite',
    price: '$24',
    tag: 'Top-tier club account',
    rating: '4.7',
    stock: '5 left',
    category: 'Sports',
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=700&q=80',
    description: 'Elite FC account with top-tier team chemistry and competitive-edge build.',
  },
  {
    title: 'PUBG Royale',
    price: '$20',
    tag: 'Battle royale account',
    rating: '4.8',
    stock: '9 left',
    category: 'Battle Royale',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
    description: 'PUBG account designed for competitive play with premium unlocks and stable delivery.',
  },
  {
    title: 'Free Fire Diamond',
    price: '$9',
    tag: 'Diamond + elite skins',
    rating: '4.6',
    stock: '15 left',
    category: 'Mobile',
    image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
    description: 'Mobile-first account with diamonds, premium characters, and smooth activation support.',
  },
  {
    title: 'COD Modern Ops',
    price: '$16',
    tag: 'Operator pack included',
    rating: '4.7',
    stock: '6 left',
    category: 'Shooter',
    image_url: 'https://images.unsplash.com/photo-1586182987320-4f376d39d787?auto=format&fit=crop&w=700&q=80',
    description: 'Call of Duty account with operator progression, weapon skins, and secure handoff.',
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
  INSERT OR IGNORE INTO products (title, price, tag, rating, stock, category, image_url, description)
  VALUES (@title, @price, @tag, @rating, @stock, @category, @image_url, @description)
`);

const insertReview = db.prepare(`
  INSERT OR IGNORE INTO reviews (name, comment, rating)
  VALUES (@name, @comment, @rating)
`);

for (const product of seedProducts) {
  insertProduct.run(product);
}

for (const review of seedReviews) {
  insertReview.run(review);
}

export function getDb() {
  return db;
}
