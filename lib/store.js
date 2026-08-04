import crypto from 'crypto';
import { getDb } from './db';
import { encryptText, decryptText } from './crypto';

const db = getDb();
const otpEncryptionKey = crypto.createHash('sha256').update(process.env.OTP_ENCRYPTION_KEY || process.env.ORDER_ENCRYPTION_KEY || 'default-otp-encryption-key-change-me').digest();

function encryptOTP(otp) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', otpEncryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(otp, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
}

function decryptOTP(encrypted) {
  if (!encrypted || typeof encrypted !== 'string') {
    return '';
  }
  try {
    const [ivText, authTagText, ciphertextText] = encrypted.split('.');
    if (!ivText || !authTagText || !ciphertextText) {
      return '';
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', otpEncryptionKey, Buffer.from(ivText, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagText, 'base64'));
    const plain = Buffer.concat([decipher.update(Buffer.from(ciphertextText, 'base64')), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    return '';
  }
}

function constantTimeEqual(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  const maxLength = Math.max(bufferA.length, bufferB.length);
  const paddedA = Buffer.alloc(maxLength, 0);
  const paddedB = Buffer.alloc(maxLength, 0);
  bufferA.copy(paddedA);
  bufferB.copy(paddedB);
  return crypto.timingSafeEqual(paddedA, paddedB);
}
const productSelect = db.prepare(`
  SELECT id, title, price, tag, rating, stock, category, game_id as gameId, image_url as imageUrl, description
  FROM products
  ORDER BY id ASC
`);

const productsByGameSelect = db.prepare(`
  SELECT id, title, price, tag, rating, stock, category, game_id as gameId, image_url as imageUrl, description
  FROM products
  WHERE game_id = @gameId
  ORDER BY id ASC
`);
const reviewsSelect = db.prepare('SELECT name, comment, rating FROM reviews ORDER BY id DESC');
const ordersSelect = db.prepare(`
  SELECT id, name, email, game, launcher, launcher_id as launcherId, account_id as accountId, account_password as accountPassword,
         note, amount_paise as amountPaise, coupon_code as couponCode, discount_paise as discountPaise,
         razorpay_order_id as razorpayOrderId,
         razorpay_payment_id as razorpayPaymentId, status, created_at as createdAt
  FROM orders ORDER BY created_at DESC
`);
const orderByIdSelect = db.prepare(`
  SELECT id, name, email, game, launcher, launcher_id as launcherId, account_id as accountId, account_password as accountPassword,
         note, amount_paise as amountPaise, coupon_code as couponCode, discount_paise as discountPaise,
         razorpay_order_id as razorpayOrderId,
         razorpay_payment_id as razorpayPaymentId, status, created_at as createdAt
  FROM orders WHERE id = @id
`);
const insertOrder = db.prepare(`
  INSERT INTO orders (id, name, email, game, launcher, launcher_id, account_id, account_password, note, amount_paise, coupon_code, discount_paise, status, created_at, game_id)
  VALUES (@id, @name, @email, @game, @launcher, @launcherId, @accountId, @accountPassword, @note, @amountPaise, @couponCode, @discountPaise, @status, @createdAt, @gameId)
`);
const insertReview = db.prepare(`
  INSERT OR IGNORE INTO reviews (name, comment, rating)
  VALUES (@name, @comment, @rating)
`);
const createProductStatement = db.prepare(`
  INSERT INTO products (title, price, tag, rating, stock, category, game_id, image_url, description)
  VALUES (@title, @price, @tag, @rating, @stock, @category, @gameId, @imageUrl, @description)
`);
const updateProductStatement = db.prepare(`
  UPDATE products
  SET title = @title,
      price = @price,
      tag = @tag,
      rating = @rating,
      stock = @stock,
      category = @category,
      game_id = @gameId,
      image_url = @imageUrl,
      description = @description
  WHERE id = @id
`);
const deleteProductStatement = db.prepare('DELETE FROM products WHERE id = @id');
const productByIdSelect = db.prepare('SELECT id, title, price FROM products WHERE id = @id');
const productByTitleSelect = db.prepare('SELECT id, title, price FROM products WHERE title = @title COLLATE NOCASE');
const ordersSelectAdmin = db.prepare(`
  SELECT id, name, email, game, launcher, launcher_id as launcherId, account_id as accountId, account_password as accountPassword,
         note, amount_paise as amountPaise, coupon_code as couponCode, discount_paise as discountPaise,
         razorpay_order_id as razorpayOrderId, razorpay_payment_id as razorpayPaymentId, status, created_at as createdAt,
         platform_type, discord_username, whatsapp_phone, service_type, twofa_backup_code, delivery_eta,
         otp_code, otp_expiry, fulfillment_agent_id, fulfillment_started_at, discord_webhook_id, sensitive_data_purged,
         delivery_proof, game_id as gameId
  FROM orders 
  WHERE status IN ('pending', 'paid', 'in_progress', 'delivered')
  ORDER BY created_at DESC
`);

const ordersByGameSelectAdmin = db.prepare(`
  SELECT id, name, email, game, launcher, launcher_id as launcherId, account_id as accountId, account_password as accountPassword,
         note, amount_paise as amountPaise, coupon_code as couponCode, discount_paise as discountPaise,
         razorpay_order_id as razorpayOrderId, razorpay_payment_id as razorpayPaymentId, status, created_at as createdAt,
         platform_type, discord_username, whatsapp_phone, service_type, twofa_backup_code, delivery_eta,
         otp_code, otp_expiry, fulfillment_agent_id, fulfillment_started_at, discord_webhook_id, sensitive_data_purged,
         delivery_proof, game_id as gameId
  FROM orders 
  WHERE game_id = @gameId AND status IN ('pending', 'paid', 'in_progress', 'delivered')
  ORDER BY created_at DESC
`);

const ordersByUserSelect = db.prepare(`
  SELECT id, name, email, game, launcher, launcher_id as launcherId, note, amount_paise as amountPaise,
         coupon_code as couponCode, discount_paise as discountPaise, status, created_at as createdAt,
         platform_type, service_type, delivery_eta, game_id as gameId
  FROM orders 
  WHERE email = @email
  ORDER BY created_at DESC
`);

const updateDeliveryProofStatement = db.prepare(`
  UPDATE orders SET delivery_proof = @deliveryProof WHERE id = @id
`);
const getUserByGoogleIdStatement = db.prepare('SELECT id, name, email FROM users WHERE google_id = @googleId');
const getUserByEmailStatement = db.prepare('SELECT id, name, email FROM users WHERE email = @email');
const getUserByIdStatement = db.prepare('SELECT id, name, email FROM users WHERE id = @id');
const createGoogleUserStatement = db.prepare(`
  INSERT INTO users (name, email, google_id, password_hash)
  VALUES (@name, @email, @googleId, '')
`);
const linkGoogleIdStatement = db.prepare('UPDATE users SET google_id = @googleId WHERE id = @id');
const totalOrdersStatement = db.prepare('SELECT COUNT(*) as count FROM orders');
const averageRatingStatement = db.prepare('SELECT COALESCE(AVG(CAST(rating AS REAL)), 0) as average FROM reviews');
const setRazorpayOrderIdStatement = db.prepare('UPDATE orders SET razorpay_order_id = @razorpayOrderId WHERE id = @id');
const markOrderPaidStatement = db.prepare('UPDATE orders SET razorpay_payment_id = @razorpayPaymentId, status = \'paid\' WHERE id = @id');
const setOrderStatusStatement = db.prepare('UPDATE orders SET status = @status WHERE id = @id');

const couponByCodeSelect = db.prepare('SELECT * FROM coupons WHERE code = @code COLLATE NOCASE');
const couponsSelect = db.prepare('SELECT * FROM coupons ORDER BY id DESC');
const couponByIdSelect = db.prepare('SELECT * FROM coupons WHERE id = @id');
const createCouponStatement = db.prepare(`
  INSERT INTO coupons (code, discount_type, discount_value, active, max_uses, used_count, expires_at)
  VALUES (@code, @discountType, @discountValue, @active, @maxUses, @usedCount, @expiresAt)
`);
const updateCouponStatement = db.prepare(`
  UPDATE coupons
  SET code = @code,
      discount_type = @discountType,
      discount_value = @discountValue,
      active = @active,
      max_uses = @maxUses,
      expires_at = @expiresAt
  WHERE id = @id
`);
const deleteCouponStatement = db.prepare('DELETE FROM coupons WHERE id = @id');
const incrementCouponUsesStatement = db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = @id');

export async function readStore(gameId = null) {
  const featuredAccounts = gameId ? productsByGameSelect.all({ gameId }) : productSelect.all();
  const reviews = reviewsSelect.all();
  const orderCount = totalOrdersStatement.get().count;
  const average = Number(averageRatingStatement.get().average || 0);

  return {
    featuredAccounts,
    reviews,
    stats: {
      ordersCompleted: orderCount + 2400,
      repeatBuyers: 98,
      averageRating: Number.isFinite(average) ? average.toFixed(1) : '0.0',
    },
  };
}

export async function listProducts(gameId = null) {
  return gameId ? productsByGameSelect.all({ gameId }) : productSelect.all();
}

export async function getProductsByGame(gameId) {
  return productsByGameSelect.all({ gameId });
}

export async function getProductById(id) {
  return productByIdSelect.get({ id: Number(id) }) || null;
}

export async function getProductByTitle(title) {
  return productByTitleSelect.get({ title: String(title || '').trim() }) || null;
}

export function priceToPaise(price) {
  const rupees = Number.parseFloat(String(price || '').replace(/[^0-9.]/g, '')) || 0;
  return Math.round(rupees * 100);
}

export async function createProduct(payload) {
  const productEntry = {
    title: String(payload.title || '').trim(),
    price: String(payload.price || '').trim(),
    tag: String(payload.tag || '').trim(),
    rating: String(payload.rating || '4.8').trim(),
    stock: String(payload.stock || 'In stock').trim(),
    category: String(payload.category || 'Game').trim(),
    gameId: String(payload.gameId || payload.game_id || 'gta5').trim(),
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
    gameId: String(payload.gameId || payload.game_id || 'gta5').trim(),
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

export async function createOrderWith2FA(payload) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const game = String(payload.game || '').trim();
  const launcher = String(payload.launcher || '').trim();
  const launcherId = String(payload.launcherId || payload.launcher_id || '').trim();
  const accountId = String(payload.accountId || payload.account_id || '').trim();
  const accountPassword = String(payload.accountPassword || payload.account_password || '');
  const platformType = String(payload.platformType || payload.platform_type || '').trim();
  const serviceType = String(payload.serviceType || payload.service_type || 'account_recovery').trim();
  const discordUsername = String(payload.discordUsername || payload.discord_username || '').trim();
  const whatsappPhone = String(payload.whatsappPhone || payload.whatsapp_phone || '').trim();
  const twofaBackupCode = String(payload.twofaBackupCode || payload.twofa_backup_code || '');
  const couponCode = String(payload.couponCode || payload.coupon_code || '');
  const deliveryETA = String(payload.deliveryETA || payload.delivery_eta || '');
  const discordWebhookId = String(payload.discordWebhookId || payload.discord_webhook_id || '').trim();
  const gameId = String(payload.gameId || payload.game_id || 'gta5').trim();

  if (!name || !email || !game || !launcher || !serviceType) {
    throw new Error('Name, email, game, launcher, and service type are required to place an order.');
  }

  const product = await getProductByTitle(game);
  if (!product) {
    throw new Error('The selected game product could not be found.');
  }

  const { code: appliedCoupon, amountPaise, discountPaise } = applyCoupon(couponCode, priceToPaise(product.price));

  let encryptedAccountId = null;
  let encryptedAccountPassword = null;
  let encrypted2faBackupCode = null;
  if (accountId || accountPassword || twofaBackupCode) {
    encryptedAccountId = encryptText(accountId);
    encryptedAccountPassword = encryptText(accountPassword);
    encrypted2faBackupCode = encryptText(twofaBackupCode);
  }

  const orderEntry = {
    id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name,
    email,
    game: product.title,
    launcher,
    launcherId,
    accountId: encryptedAccountId,
    accountPassword: encryptedAccountPassword,
    note: String(payload.note || '').trim().slice(0, 2000),
    amountPaise,
    couponCode: appliedCoupon,
    discountPaise,
    status: 'pending',
    createdAt: new Date().toISOString(),
    platformType,
    discordUsername,
    whatsappPhone,
    serviceType,
    twofaBackupCode: encrypted2faBackupCode,
    deliveryEta: deliveryETA,
    discordWebhookId,
    gameId,
  };

  const result = insertOrder.run(orderEntry);
  const orderId = String(result.lastInsertRowid);

  return {
    ...orderEntry,
    id: orderId,
    accountId: accountId ? 'encrypted' : null,
    accountPassword: accountPassword ? 'encrypted' : null,
    twofaBackupCode: twofaBackupCode ? 'encrypted' : null,
  };
}

export async function getOrdersForFulfillment() {
  const ordersSelectForFulfillment = db.prepare(`
    SELECT id, name, email, game, launcher, launcher_id as launcherId, account_id as accountId, account_password as accountPassword,
           note, amount_paise as amountPaise, coupon_code as couponCode, discount_paise as discountPaise,
           razorpay_order_id as razorpayOrderId, razorpay_payment_id as razorpayPaymentId, status, created_at as createdAt,
           platform_type, discord_username, whatsapp_phone, service_type, twofa_backup_code, delivery_eta,
           otp_code, otp_expiry, fulfillment_agent_id, fulfillment_started_at, discord_webhook_id, sensitive_data_purged
    FROM orders 
    WHERE status IN ('pending', 'paid', 'in_progress', 'delivered')
    ORDER BY created_at DESC
  `);

  return ordersSelectForFulfillment.all();
}

export async function updateOrderFulfillmentStatus(orderId, status, agentId = null) {
  const allowedStatuses = ['pending', 'paid', 'in_progress', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid order status.');
  }

  let updateQuery = `UPDATE orders SET status = @status`;
  const params = { id: String(orderId), status };

  if (status === 'in_progress' && agentId) {
    updateQuery += `, fulfillment_agent_id = @agentId, fulfillment_started_at = @startedAt`;
    params.agentId = agentId;
    params.startedAt = new Date().toISOString();
  }

  if (status === 'delivered') {
    updateQuery += `, sensitive_data_purged = 1`;
    if (params.agentId) {
      delete params.agentId;
    }
  }

  const updateStatement = db.prepare(updateQuery);
  updateStatement.run(params);
  return { updated: true, id: String(orderId), status };
}

export async function generateAndStoreOTP(orderId, expiryMinutes = 15) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);

  const encryptedOTP = encryptOTP(otpCode);

  const updateStatement = db.prepare(
    `UPDATE orders SET otp_code = @otp, otp_expiry = @expiry WHERE id = @id`
  );
  updateStatement.run({
    id: String(orderId),
    otp: encryptedOTP,
    expiry: expiryTime.toISOString(),
  });

  return { otpCode, expiresAt: expiryTime.toISOString() };
}

export async function verifyOTP(orderId, providedOtp) {
  const order = db.prepare(
    `SELECT otp_code, otp_expiry FROM orders WHERE id = @id`
  ).get({ id: String(orderId) });

  if (!order || !order.otp_code) {
    throw new Error('No OTP found for this order.');
  }

  if (new Date() > new Date(order.otp_expiry)) {
    throw new Error('OTP has expired.');
  }

  const decryptedOTP = decryptOTP(order.otp_code);

  if (!constantTimeEqual(decryptedOTP, providedOtp)) {
    throw new Error('Invalid OTP.');
  }

  return true;
}

export async function purgeSensitiveData(orderId) {
  const updateStatement = db.prepare(
    `UPDATE orders SET account_id = NULL, account_password = NULL, twofa_backup_code = NULL, otp_code = NULL, otp_expiry = NULL, sensitive_data_purged = 1 WHERE id = @id AND sensitive_data_purged = 0`
  );

  const result = updateStatement.run({ id: String(orderId) });
  return { purged: result.changes > 0, id: String(orderId) };
}

export async function decryptCredentials(orderId) {
  const order = db.prepare(
    `SELECT account_id, account_password, twofa_backup_code FROM orders WHERE id = @id`
  ).get({ id: String(orderId) });

  if (!order) {
    throw new Error('Order not found.');
  }

  let decryptedAccountId = null;
  let decryptedAccountPassword = null;
  let decrypted2faBackupCode = null;

  if (order.account_id) {
    decryptedAccountId = decryptText(order.account_id);
  }

  if (order.account_password) {
    decryptedAccountPassword = decryptText(order.account_password);
  }

  if (order.twofa_backup_code) {
    decrypted2faBackupCode = decryptText(order.twofa_backup_code);
  }

  return {
    accountId: decryptedAccountId,
    accountPassword: decryptedAccountPassword,
    twofaBackupCode: decrypted2faBackupCode,
  };
}

export async function sendDiscordWebhook(webhookUrl, orderData) {
  if (!webhookUrl) return null;

  const message = {
    content: `🔔 **New GTA V Service Order**

🆔 **Order ID:** ${orderData.id}
🛒 **Service:** ${orderData.serviceType || 'Account Recovery'}
🖥️ **Platform:** ${orderData.platformType || 'Not specified'}
👤 **Customer:** ${orderData.discordUsername || orderData.name} (${orderData.email})
💰 **Total:** ₹${(orderData.amountPaise / 100).toLocaleString('en-IN')}
📦 **Status:** ${orderData.status}
⏰ **Time:** ${new Date(orderData.createdAt).toLocaleString('en-IN')}`
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  return response.ok;
}

export async function findOrCreateGoogleUser(payload) {
  const googleId = String(payload.googleId || '').trim();
  const name = String(payload.name || '').trim() || 'Google user';
  const email = String(payload.email || '').trim().toLowerCase();

  if (!googleId || !email) {
    throw new Error('Google profile is missing required details.');
  }

  const existingByGoogleId = getUserByGoogleIdStatement.get({ googleId });
  if (existingByGoogleId) {
    return { id: existingByGoogleId.id, name: existingByGoogleId.name, email: existingByGoogleId.email };
  }

  const existingByEmail = getUserByEmailStatement.get({ email });
  if (existingByEmail) {
    linkGoogleIdStatement.run({ id: existingByEmail.id, googleId });
    return { id: existingByEmail.id, name: existingByEmail.name, email: existingByEmail.email };
  }

  const result = createGoogleUserStatement.run({ name, email, googleId });
  return {
    id: Number(result.lastInsertRowid),
    name,
    email,
  };
}

export async function getUserById(id) {
  return getUserByIdStatement.get({ id: Number(id) }) || null;
}

export async function createOrder(payload) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const game = String(payload.game || '').trim();
  const launcher = String(payload.launcher || '').trim();
  const launcherId = String(payload.launcherId || payload.launcher_id || '').trim();
  const accountId = String(payload.accountId || payload.account_id || '').trim();
  const accountPassword = String(payload.accountPassword || payload.account_password || '');

  if (!name || !email || !game || !launcher) {
    throw new Error('Name, email, game, and launcher are required to place an order.');
  }

  const product = await getProductByTitle(game);
  if (!product) {
    throw new Error('The selected game product could not be found.');
  }

  const { code: appliedCoupon, amountPaise, discountPaise } = applyCoupon(
    payload.couponCode || payload.coupon_code || '',
    priceToPaise(product.price),
  );

  let encryptedAccountId = null;
  let encryptedAccountPassword = null;
  if (accountId || accountPassword) {
    encryptedAccountId = encryptText(accountId);
    encryptedAccountPassword = encryptText(accountPassword);
  }

  const orderEntry = {
    id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name,
    email,
    game: product.title,
    launcher,
    launcherId,
    accountId: encryptedAccountId,
    accountPassword: encryptedAccountPassword,
    note: String(payload.note || '').trim().slice(0, 2000),
    amountPaise,
    couponCode: appliedCoupon,
    discountPaise,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  insertOrder.run(orderEntry);
  return {
    ...orderEntry,
    accountId: accountId ? 'encrypted' : null,
    accountPassword: accountPassword ? 'encrypted' : null,
  };
}

export async function listOrders(gameId = null) {
  return gameId ? ordersByGameSelectAdmin.all({ gameId }) : ordersSelectAdmin.all();
}

export async function listOrdersByUser(email) {
  return ordersByUserSelect.all({ email: String(email || '').trim().toLowerCase() });
}

export async function getOrderById(id) {
  return orderByIdSelect.get({ id: String(id) }) || null;
}

export async function updateDeliveryProof(orderId, deliveryProof) {
  updateDeliveryProofStatement.run({ id: String(orderId), deliveryProof: String(deliveryProof || '').trim() });
  return { updated: true, id: String(orderId) };
}

export async function attachRazorpayOrder(orderId, razorpayOrderId) {
  setRazorpayOrderIdStatement.run({ id: String(orderId), razorpayOrderId: String(razorpayOrderId) });
}

export async function markOrderPaid(orderId, razorpayPaymentId) {
  markOrderPaidStatement.run({ id: String(orderId), razorpayPaymentId: String(razorpayPaymentId) });
}

export async function updateOrderStatus(orderId, status) {
  const allowedStatuses = ['pending', 'paid', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid order status.');
  }

  setOrderStatusStatement.run({ id: String(orderId), status });
}

export function applyCoupon(couponCode, amountPaise) {
  const code = String(couponCode || '').trim();
  if (!code) {
    return { code: null, amountPaise, discountPaise: 0 };
  }

  const coupon = couponByCodeSelect.get({ code });
  if (!coupon) {
    throw new Error('That promo code does not exist.');
  }

  if (coupon.active !== 1) {
    throw new Error('That promo code is no longer active.');
  }

  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    throw new Error('That promo code has reached its usage limit.');
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    throw new Error('That promo code has expired.');
  }

  const value = Number(coupon.discount_value) || 0;
  const discount =
    coupon.discount_type === 'fixed'
      ? Math.round(value * 100)
      : Math.round((amountPaise * value) / 100);

  const safeDiscount = Math.min(Math.max(discount, 0), amountPaise);

  incrementCouponUsesStatement.run({ id: coupon.id });

  return {
    code: coupon.code,
    amountPaise: amountPaise - safeDiscount,
    discountPaise: safeDiscount,
  };
}

export async function listCoupons() {
  return couponsSelect.all();
}

export async function createCoupon(payload) {
  const code = String(payload.code || '').trim().toUpperCase();
  const discountType = String(payload.discountType || payload.discount_type || 'percent').trim();
  const discountValue = Number.parseFloat(payload.discountValue ?? payload.discount_value);
  const maxUses = Math.max(0, Number.parseInt(payload.maxUses ?? payload.max_uses, 10) || 0);
  const expiresAt = payload.expiresAt || payload.expires_at || null;

  if (!code || !['percent', 'fixed'].includes(discountType)) {
    throw new Error('A promo code and a valid discount type (percent or fixed) are required.');
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error('Discount value must be a positive number.');
  }

  if (discountType === 'percent' && discountValue > 100) {
    throw new Error('Percent discount cannot exceed 100.');
  }

  const existing = couponByCodeSelect.get({ code });
  if (existing) {
    throw new Error('That promo code already exists.');
  }

  const couponEntry = {
    code,
    discountType,
    discountValue,
    active: payload.active !== undefined && payload.active !== null ? Number(payload.active) : 1,
    maxUses,
    usedCount: 0,
    expiresAt,
  };

  const result = createCouponStatement.run(couponEntry);
  return { id: Number(result.lastInsertRowid), ...couponEntry };
}

export async function updateCoupon(id, payload) {
  const coupon = couponByIdSelect.get({ id: Number(id) });
  if (!coupon) {
    throw new Error('Promo code not found.');
  }

  const code = String(payload.code || '').trim().toUpperCase();
  const discountType = String(payload.discountType || payload.discount_type || 'percent').trim();
  const discountValue = Number.parseFloat(payload.discountValue ?? payload.discount_value);
  const maxUses = Math.max(0, Number.parseInt(payload.maxUses ?? payload.max_uses, 10) || 0);
  const expiresAt = payload.expiresAt || payload.expires_at || null;

  if (!code || !['percent', 'fixed'].includes(discountType)) {
    throw new Error('A promo code and a valid discount type (percent or fixed) are required.');
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error('Discount value must be a positive number.');
  }

  if (discountType === 'percent' && discountValue > 100) {
    throw new Error('Percent discount cannot exceed 100.');
  }

  updateCouponStatement.run({
    id: coupon.id,
    code,
    discountType,
    discountValue,
    active: payload.active !== undefined && payload.active !== null ? Number(payload.active) : coupon.active,
    maxUses,
    expiresAt,
  });

  return { id: coupon.id, code, discountType, discountValue, maxUses, expiresAt, active: Number(payload.active ?? coupon.active) };
}

export async function deleteCoupon(id) {
  deleteCouponStatement.run({ id: Number(id) });
  return { deleted: true, id: Number(id) };
}

export async function addReview(payload) {
  const name = String(payload.name || '').trim().slice(0, 80);
  const comment = String(payload.comment || '').trim().slice(0, 2000);
  const rating = Number.parseFloat(payload.rating);

  if (!name || !comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error('A valid name, comment, and a rating between 1 and 5 are required.');
  }

  const reviewEntry = {
    name,
    comment,
    rating: rating.toFixed(1),
  };

  insertReview.run(reviewEntry);
  return reviewEntry;
}
