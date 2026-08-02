import crypto from 'crypto';
import { getDb } from './db';

const db = getDb();
const productSelect = db.prepare(`
  SELECT id, title, price, tag, rating, stock, category, image_url as imageUrl, description
  FROM products
  ORDER BY id ASC
`);
const reviewsSelect = db.prepare('SELECT name, comment, rating FROM reviews ORDER BY id DESC');
const ordersSelect = db.prepare('SELECT id, name, email, game, note, status, created_at as createdAt FROM orders ORDER BY created_at DESC');
const insertOrder = db.prepare(`
  INSERT INTO orders (id, name, email, game, note, status, created_at)
  VALUES (@id, @name, @email, @game, @note, @status, @createdAt)
`);
const insertReview = db.prepare(`
  INSERT OR IGNORE INTO reviews (name, comment, rating)
  VALUES (@name, @comment, @rating)
`);
const createProductStatement = db.prepare(`
  INSERT INTO products (title, price, tag, rating, stock, category, image_url, description)
  VALUES (@title, @price, @tag, @rating, @stock, @category, @imageUrl, @description)
`);
const updateProductStatement = db.prepare(`
  UPDATE products
  SET title = @title,
      price = @price,
      tag = @tag,
      rating = @rating,
      stock = @stock,
      category = @category,
      image_url = @imageUrl,
      description = @description
  WHERE id = @id
`);
const deleteProductStatement = db.prepare('DELETE FROM products WHERE id = @id');
const getUserByEmailStatement = db.prepare('SELECT id, name, email, password_hash as passwordHash FROM users WHERE email = @email');
const getUserByIdStatement = db.prepare('SELECT id, name, email FROM users WHERE id = @id');
const createUserStatement = db.prepare(`
  INSERT INTO users (name, email, password_hash)
  VALUES (@name, @email, @passwordHash)
`);
const totalOrdersStatement = db.prepare('SELECT COUNT(*) as count FROM orders');
const averageRatingStatement = db.prepare('SELECT COALESCE(AVG(CAST(rating AS REAL)), 0) as average FROM reviews');

export async function readStore() {
  const featuredAccounts = productSelect.all();
  const reviews = reviewsSelect.all();
  const orders = ordersSelect.all();
  const orderCount = totalOrdersStatement.get().count;
  const average = Number(averageRatingStatement.get().average || 0);

  return {
    featuredAccounts,
    reviews,
    orders,
    stats: {
      ordersCompleted: orderCount + 2400,
      repeatBuyers: 98,
      averageRating: Number.isFinite(average) ? average.toFixed(1) : '0.0',
    },
  };
}

export async function listProducts() {
  return productSelect.all();
}

export async function createProduct(payload) {
  const productEntry = {
    title: String(payload.title || '').trim(),
    price: String(payload.price || '').trim(),
    tag: String(payload.tag || '').trim(),
    rating: String(payload.rating || '4.8').trim(),
    stock: String(payload.stock || 'In stock').trim(),
    category: String(payload.category || 'Game').trim(),
    imageUrl: String(payload.imageUrl || payload.image_url || '').trim(),
    description: String(payload.description || '').trim(),
  };

  if (!productEntry.title || !productEntry.price || !productEntry.tag) {
    throw new Error('Title, price, and tag are required to create a product.');
  }

  const result = createProductStatement.run(productEntry);
  return {
    id: Number(result.lastInsertRowid),
    ...productEntry,
  };
}

export async function updateProduct(id, payload) {
  const productEntry = {
    id: Number(id),
    title: String(payload.title || '').trim(),
    price: String(payload.price || '').trim(),
    tag: String(payload.tag || '').trim(),
    rating: String(payload.rating || '4.8').trim(),
    stock: String(payload.stock || 'In stock').trim(),
    category: String(payload.category || 'Game').trim(),
    imageUrl: String(payload.imageUrl || payload.image_url || '').trim(),
    description: String(payload.description || '').trim(),
  };

  if (!productEntry.id || !productEntry.title || !productEntry.price || !productEntry.tag) {
    throw new Error('A valid product ID, title, price, and tag are required.');
  }

  updateProductStatement.run(productEntry);
  return productEntry;
}

export async function deleteProduct(id) {
  deleteProductStatement.run({ id: Number(id) });
  return { deleted: true, id: Number(id) };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) {
    return false;
  }

  const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
}

export async function createUser(payload) {
  const normalizedName = String(payload.name || '').trim();
  const normalizedEmail = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  if (!normalizedName || !normalizedEmail || !password) {
    throw new Error('Name, email, and password are required to create a buyer account.');
  }

  const existingUser = getUserByEmailStatement.get({ email: normalizedEmail });
  if (existingUser) {
    throw new Error('A buyer account with that email already exists.');
  }

  const passwordHash = hashPassword(password);
  const result = createUserStatement.run({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
  });

  return {
    id: Number(result.lastInsertRowid),
    name: normalizedName,
    email: normalizedEmail,
  };
}

export async function loginUser(payload) {
  const normalizedEmail = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required to sign in.');
  }

  const foundUser = getUserByEmailStatement.get({ email: normalizedEmail });
  if (!foundUser || !verifyPassword(password, foundUser.passwordHash)) {
    throw new Error('Incorrect email or password.');
  }

  return {
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
  };
}

export async function getUserById(id) {
  return getUserByIdStatement.get({ id: Number(id) }) || null;
}

export async function addOrder(payload) {
  const orderEntry = {
    id: Date.now().toString(),
    name: payload.name,
    email: payload.email,
    game: payload.game,
    note: payload.note || '',
    status: payload.status || 'pending',
    createdAt: new Date().toISOString(),
  };

  insertOrder.run(orderEntry);
  return orderEntry;
}

export async function addReview(payload) {
  const reviewEntry = {
    name: payload.name,
    comment: payload.comment,
    rating: payload.rating,
  };

  insertReview.run(reviewEntry);
  return reviewEntry;
}
