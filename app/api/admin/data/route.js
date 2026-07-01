import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, BankDetails, Transaction, Order, Scheme, VirtualAccount } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

// Helper to auto-cancel pending orders that are drafts (start with DRAFT-) older than 15 minutes
async function autoCancelPendingOrders() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  await Order.updateMany(
    {
      status: 'pending',
      utr: { $regex: /^DRAFT-/ },
      created_at: { $lt: fifteenMinutesAgo }
    },
    { status: 'cancelled' }
  );
}

export async function GET(request) {
  try {
    await connectDB();
    await autoCancelPendingOrders();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Secure check: verify that the user is the administrator via database role
    const adminCheck = await User.findById(session.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }
    
    // 1. Get all schemes
    const rawSchemes = await Scheme.find().sort({ _id: -1 });
    const schemes = rawSchemes.map(s => ({
      id: s._id.toString(),
      name: s.name,
      price: s.price,
      daily_return_rate: s.daily_return_rate,
      days: s.days,
      total_return: s.total_return
    }));

    // 2. Get all virtual accounts
    const rawVirtualAccounts = await VirtualAccount.find()
      .populate('locked_by_user_id')
      .sort({ _id: -1 });

    const virtualAccounts = rawVirtualAccounts.map(va => ({
      id: va._id.toString(),
      account_number: va.account_number,
      bank_name: va.bank_name,
      beneficiary_name: va.beneficiary_name,
      ifsc: va.ifsc,
      upi_id: va.upi_id || '',
      is_locked: va.is_locked || false,
      locked_until: va.locked_until || null,
      locked_by_username: va.locked_by_user_id ? va.locked_by_user_id.username : null,
      locked_by_user_id: va.locked_by_user_id ? va.locked_by_user_id._id.toString() : null,
      last_assigned_at: va.last_assigned_at || null,
      is_enabled: va.is_enabled !== false,
      allow_concurrent: va.allow_concurrent || false,
      qr_code: va.qr_code || ''
    }));

    return NextResponse.json({
      success: true,
      users: [],
      transactions: [],
      orders: [],
      schemes,
      virtualAccounts
    });
  } catch (error) {
    console.error('Admin fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin details.' }, { status: 500 });
  }
}
