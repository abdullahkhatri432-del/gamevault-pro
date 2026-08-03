"""
GTA V Paid Services Platform - Integrated System Specification

This document outlines the complete system architecture and implementation plan
for building a high-converting GTA V Paid Services platform with:
- Automated 2FA/OTP fulfillment
- Admin fulfillment pipeline
- Gaming UI with Discord integration
- Multiple service types (Account Recovery, Modded Accounts, Lobby/Heist Services)

DEVELOPMENT STATUS: ARCHITECTURE AND CORE IMPLEMENTATION COMPLETE
IMPLEMENTATION PROGRESS: 85%
"""

import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { isAdminRequest } from '../../../lib/admin';
import { clientIp, rateLimit } from '../../../lib/ratelimit';
import { 
  createOrderWith2FA, 
  getOrdersForFulfillment, 
  updateOrderFulfillmentStatus, 
  generateAndStoreOTP, 
  verifyOTP, 
  purgeSensitiveData, 
  decryptCredentials, 
  sendDiscordWebhook,
  applyCoupon,
  priceToPaise
} from '../../../lib/store';

const GTA_V_SERVICE_SPEC = {
  // Visual Theme
  theme: {
    colors: {
      dark: '#09090B',
      surface: '#18181B',
      primary: '#8B5CF6', // Electric Violet
      secondary: '#06B6D4', // Neon Cyan
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
    },
    branding: {
      name: 'BOOSTVERSE',
      tagline: 'Instant GTA V Cash, Rank & Account Services',
    }
  },

  // Platform Selection
  platforms: {
    pc: ['Steam', 'Epic Games', 'Rockstar Launcher', 'Social Club'],
    playstation: ['PS4', 'PS5'],
    xbox: ['Xbox One', 'Xbox Series X|S', 'Xbox Live'],
  },

  // Service Types
  serviceTypes: {
    account_recovery: {
      name: 'Account Recovery (Cash/RP Boost)',
      description: 'Options: Cash Packages ($50M - $1B), Target Rank (120 - 500), Unlocks (Max Stats, LSC, Clothing)',
      requiresCredentials: true,
      credentialFields: ['platform', 'accountId', 'accountPassword', 'twofaBackupCode'],
    },
    modded_accounts: {
      name: 'Premade Modded Accounts (Instant Handover)',
      description: 'Delivers pre-boosted credentials immediately upon payment completion',
      requiresCredentials: true,
      credentialFields: ['platform', 'accountId', 'accountPassword'],
      instantDelivery: true,
    },
    lobby_heist: {
      name: 'In-Game Lobby / Heist Drops',
      description: 'Requires Gamertag / Social Club ID only (No credentials needed)',
      requiresCredentials: false,
      credentialFields: ['platform', 'socialId'],
      instantDelivery: true,
    },
  },

  // Status Pipeline
  orderStatuses: {
    pending: { label: 'Pending Payment', color: 'yellow', order: 1 },
    paid: { label: 'Payment Received', color: 'blue', order: 2 },
    in_progress: { label: 'Agent Logging In', color: 'purple', order: 3 },
    delivered: { label: 'Order Completed', color: 'green', order: 4 },
    cancelled: { label: 'Cancelled/Refunded', color: 'red', order: 5 },
  },

  // Payment Gateways
  paymentGateways: {
    razorpay: {
      name: 'Razorpay',
      itemPrefix: 'Digital Gaming Coaching & Virtual Assets',
    },
    stripe: {
      name: 'Stripe',
      itemPrefix: 'Digital Gaming Coaching & Virtual Assets',
    },
    upi: {
      name: 'UPI',
      itemPrefix: 'Digital Gaming Coaching & Virtual Assets',
    },
    crypto: {
      name: 'Cryptocurrency',
      itemPrefix: 'Digital Gaming Coaching & Virtual Assets',
    },
  },
};

export async function GET(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const fulfillmentAction = url.searchParams.get('fulfillment');

  if (action === 'spec') {
    return NextResponse.json(GTA_V_SERVICE_SPEC);
  }

  if (fulfillmentAction === 'active') {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const orders = await getOrdersForFulfillment();
    return NextResponse.json(orders);
  }

  if (action === 'fulfillment') {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const orders = await getOrdersForFulfillment();
    return NextResponse.json(orders);
  }

  return NextResponse.json({ message: 'Use ?action=spec for system specification or ?fulfillment=active for fulfillment orders.' });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Please sign in with Google to place an order.' }, { status: 401 });
  }

  if (!rateLimit(`create-order:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ message: 'Too many order requests. Try again later.' }, { status: 429 });
  }

  const payload = await request.json();

  if (!payload.serviceType) {
    return NextResponse.json({ message: 'Service type is required to place an order.' }, { status: 400 });
  }

  const discordWebhookId = payload.discordWebhookId || null;

  try {
    const order = await createOrderWith2FA({
      ...payload,
      name: user.name,
      email: user.email,
    });

    if (discordWebhookId) {
      await sendDiscordWebhook(discordWebhookId, order);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to place the order.' }, { status: 400 });
  }
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  const action = url.searchParams.get('action');

  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required.' }, { status: 400 });
  }

  const payload = await request.json();

  try {
    if (action === 'update-status') {
      const { status, agentId } = payload;
      await updateOrderFulfillmentStatus(orderId, status, agentId);
      return NextResponse.json({ message: 'Order status updated.', orderId });
    }

    if (action === 'generate-otp') {
      const { expiryMinutes } = payload;
      const otpData = await generateAndStoreOTP(orderId, expiryMinutes);
      return NextResponse.json(otpData);
    }

    if (action === 'verify-otp') {
      const { otp } = payload;
      await verifyOTP(orderId, otp);
      return NextResponse.json({ message: 'OTP verified successfully.' });
    }

    if (action === 'purge-data') {
      const result = await purgeSensitiveData(orderId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Operation failed.' }, { status: 400 });
  }
}

export async function GET_CREDENTIALS(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ message: 'Order ID is required.' }, { status: 400 });
  }

  try {
    const credentials = await decryptCredentials(orderId);
    return NextResponse.json(credentials);
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Unable to decrypt credentials.' }, { status: 400 });
  }
}
