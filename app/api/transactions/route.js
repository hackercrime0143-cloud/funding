import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Transaction, VirtualAccount, BankDetails } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

// Fetch user transactions
export async function GET(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const txs = await Transaction.find({ user_id: session.id })
      .populate('virtual_account_id')
      .sort({ created_at: -1 });

    const transactions = txs.map(t => ({
      id: t._id.toString(),
      user_id: t.user_id.toString(),
      type: t.type,
      amount: t.amount,
      status: t.status,
      created_at: t.created_at,
      virtual_account: t.virtual_account_id ? t.virtual_account_id.account_number : null,
      virtual_bank: t.virtual_account_id ? t.virtual_account_id.bank_name : null,
      virtual_beneficiary: t.virtual_account_id ? t.virtual_account_id.beneficiary_name : null,
      virtual_ifsc: t.virtual_account_id ? t.virtual_account_id.ifsc : null
    }));

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions.' }, { status: 500 });
  }
}

// Create transaction (Deposit or Withdrawal)
export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { type, amount } = await request.json();

    if (!type || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valid type and positive amount are required.' }, { status: 400 });
    }

    const reqAmount = parseFloat(amount);

    if (type === 'deposit') {
      const now = new Date();
      const lockDurationMs = 15 * 60 * 1000; // Lock for 15 minutes
      const lockUntil = new Date(now.getTime() + lockDurationMs);

      // Rotation Logic: For amounts < 5000, exclude recently used virtual accounts
      let excludedVaIds = [];
      if (reqAmount < 5000) {
        const recentDeposits = await Transaction.find({ 
          user_id: session.id, 
          type: 'deposit' 
        })
        .sort({ created_at: -1 })
        .limit(3);
        
        excludedVaIds = recentDeposits
          .map(d => d.virtual_account_id ? d.virtual_account_id.toString() : null)
          .filter(id => id !== null);
      }

      // Find an available virtual account: not locked, or lock has expired, or locked by the same user
      let virtualAcc = await VirtualAccount.findOne({
        $and: [
          { _id: { $nin: excludedVaIds } },
          {
            $or: [
              { is_locked: false },
              { locked_until: { $lt: now } },
              { locked_by_user_id: session.id }
            ]
          }
        ]
      });

      // Fallback: If no account matches because they are all excluded or locked,
      // relax the exclusion constraint to find any available account
      if (!virtualAcc && excludedVaIds.length > 0) {
        virtualAcc = await VirtualAccount.findOne({
          $or: [
            { is_locked: false },
            { locked_until: { $lt: now } },
            { locked_by_user_id: session.id }
          ]
        });
      }

      // Absolute Fallback: Pick the one whose lock expires first (oldest lock)
      if (!virtualAcc) {
        virtualAcc = await VirtualAccount.findOne().sort({ locked_until: 1 });
      }

      if (!virtualAcc) {
        return NextResponse.json({ error: 'Deposit system busy. Please try again in a few minutes.' }, { status: 503 });
      }

      // Lock the virtual account for this user
      virtualAcc.is_locked = true;
      virtualAcc.locked_until = lockUntil;
      virtualAcc.locked_by_user_id = session.id;
      await virtualAcc.save();

      // Add a pending deposit transaction
      const newTx = await Transaction.create({
        user_id: session.id,
        type: 'deposit',
        amount: reqAmount,
        status: 'pending',
        virtual_account_id: virtualAcc._id
      });

      return NextResponse.json({
        success: true,
        message: 'Deposit request initiated.',
        transactionId: newTx._id.toString(),
        depositDetails: {
          amount: reqAmount,
          accountNumber: virtualAcc.account_number,
          bankName: virtualAcc.bank_name,
          beneficiaryName: virtualAcc.beneficiary_name,
          ifsc: virtualAcc.ifsc,
          expiresAt: lockUntil.toISOString()
        }
      });

    } else if (type === 'withdrawal') {
      // Check if user has linked their account details first
      const bankLinked = await BankDetails.findOne({ user_id: session.id });
      if (!bankLinked) {
        return NextResponse.json({ error: 'Please link your Bank/UPI details first in the Account section.' }, { status: 400 });
      }

      // Check minimum withdrawal limit
      if (reqAmount < 200) {
        return NextResponse.json({ error: 'Minimum withdrawal amount is ₹200.00.' }, { status: 400 });
      }

      // Check 24-hour limit
      const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last24hWithdrawal = await Transaction.findOne({
        user_id: session.id,
        type: 'withdrawal',
        created_at: { $gt: cutoff24h }
      });
      
      if (last24hWithdrawal) {
        return NextResponse.json({ error: 'You can only submit one withdrawal request every 24 hours.' }, { status: 400 });
      }

      // Check current user balance
      const user = await User.findById(session.id);
      if (user.wallet_balance < reqAmount) {
        return NextResponse.json({ error: 'Insufficient balance for this withdrawal.' }, { status: 400 });
      }

      // Deduct balance
      user.wallet_balance -= reqAmount;
      await user.save();

      // Add pending withdrawal record
      await Transaction.create({
        user_id: session.id,
        type: 'withdrawal',
        amount: -reqAmount,
        status: 'pending'
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal request submitted successfully. Your remaining balance is ₹${user.wallet_balance.toFixed(2)}. Processing will take 2-4 hours.`
      });
    }

    return NextResponse.json({ error: 'Invalid transaction type.' }, { status: 400 });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json({ error: 'Server error processing transaction.' }, { status: 500 });
  }
}
