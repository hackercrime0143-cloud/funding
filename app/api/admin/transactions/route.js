import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Transaction } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const adminCheck = await User.findById(session.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'pending'; // 'pending', 'withdrawals', 'deposits', 'cancelled'

    const skip = (page - 1) * limit;

    const query = {};

    // Filter by type or status
    if (filter === 'pending') {
      query.status = { $in: ['pending', 'confirmation_pending'] };
    } else if (filter === 'withdrawals') {
      query.type = 'withdrawal';
    } else if (filter === 'deposits') {
      query.type = 'deposit';
    } else if (filter === 'cancelled') {
      query.status = { $in: ['failed', 'cancelled', 'rejected'] };
    }

    // Search by User credentials (username, phone, support ID)
    if (search.trim() !== '') {
      const rx = new RegExp(search.trim(), 'i');
      const matchedUsers = await User.find({
        $or: [
          { username: rx },
          { phone: rx },
          { support_id: rx }
        ]
      }).select('_id');
      const userIds = matchedUsers.map(u => u._id);
      query.user_id = { $in: userIds };
    }

    const total = await Transaction.countDocuments(query);
    const rawTransactions = await Transaction.find(query)
      .populate('user_id', 'username phone support_id')
      .populate('virtual_account_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const transactions = rawTransactions.map(t => {
      const isPendingMatchOrder = t.order_id ? true : false;
      return {
        id: t._id.toString(),
        user_id: t.user_id ? t.user_id._id.toString() : null,
        user_name: t.user_id ? t.user_id.username : 'Unknown',
        user_phone: t.user_id ? t.user_id.phone : 'Unknown',
        user_support_id: t.user_id ? t.user_id.support_id : null,
        type: t.type,
        amount: t.amount,
        status: t.status,
        virtual_account_id: t.virtual_account_id ? t.virtual_account_id._id.toString() : null,
        virtual_account: t.virtual_account_id ? {
          account_number: t.virtual_account_id.account_number,
          bank_name: t.virtual_account_id.bank_name,
          beneficiary_name: t.virtual_account_id.beneficiary_name,
          upi_id: t.virtual_account_id.upi_id || ''
        } : null,
        utr: t.utr || null,
        screenshot: t.screenshot || null,
        created_at: t.created_at,
        updated_at: t.updated_at || t.created_at,
        resolved_at: t.resolved_at || null,
        approved_by_admin_username: t.approved_by_admin_username || null,
        rejection_reason: t.rejection_reason || '',
        is_order: isPendingMatchOrder,
        order_id: t.order_id ? t.order_id.toString() : null,

        // Snapshot details fallback
        deposit_bank_name: t.deposit_bank_name || (t.virtual_account_id ? t.virtual_account_id.bank_name : null),
        deposit_account_number: t.deposit_account_number || (t.virtual_account_id ? t.virtual_account_id.account_number : null),
        deposit_beneficiary_name: t.deposit_beneficiary_name || (t.virtual_account_id ? t.virtual_account_id.beneficiary_name : null),
        deposit_upi_id: t.deposit_upi_id || (t.virtual_account_id ? t.virtual_account_id.upi_id : null),
        deposit_qr_code: t.deposit_qr_code || (t.virtual_account_id ? t.virtual_account_id.qr_code : null),

        // Withdrawal snapshot fallback
        user_username: t.user_username || (t.user_id ? t.user_id.username : 'Unknown'),
        user_phone: t.user_phone || (t.user_id ? t.user_id.phone : 'Unknown'),
        withdrawal_bank_name: t.withdrawal_bank_name || null,
        withdrawal_account_name: t.withdrawal_account_name || null,
        withdrawal_account_number: t.withdrawal_account_number || null,
        withdrawal_ifsc: t.withdrawal_ifsc || null,
        withdrawal_upi_id: t.withdrawal_upi_id || null,
        wallet_balance_at_request: t.wallet_balance_at_request || 0
      };
    });

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch admin transactions error:', error);
    return NextResponse.json({ error: 'Failed to retrieve transactions.' }, { status: 500 });
  }
}
