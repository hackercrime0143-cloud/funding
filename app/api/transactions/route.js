import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Transaction, VirtualAccount, BankDetails, Order, Scheme, createAdminNotification } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';
import { saveBase64Image } from '@/lib/upload';

async function getWalletWithdrawalLimit(userId) {
  const user = await User.findById(userId);

  // Only look at CURRENTLY ACTIVE orders (days_remaining > 0) for locking.
  // Expired (expired_pending_match) and completed orders have finished —
  // their principal is no longer locked regardless of crowdfunding match status.
  const allOrders = await Order.find({
    user_id: userId,
    status: { $in: ['active', 'expired_pending_match', 'completed'] }
  });

  let lockedAmount = 0;
  let hasActiveBigScheme = false;  // ≥₹200 and still running
  let hasMaturedScheme = false;    // any scheme that has finished all days

  for (const order of allOrders) {
    const isCurrentlyRunning = order.status === 'active' && order.days_remaining > 0;
    const hasMatured = order.days_remaining === 0 || order.status === 'expired_pending_match' || order.status === 'completed';

    if (hasMatured) {
      // Principal is fully unlocked — nothing to lock
      hasMaturedScheme = true;
    } else if (isCurrentlyRunning) {
      // Lock the full principal of every running scheme
      lockedAmount += order.price;
      if (order.price >= 200) {
        hasActiveBigScheme = true;
      }
    }
  }

  const withdrawableBalance = Math.max(0, user.wallet_balance - lockedAmount);

  // ₹200 minimum applies ONLY when the user has active (running) big schemes
  // and has NOT matured any scheme yet. Once any scheme matures, the minimum is waived.
  let minWithdrawal = 200; // default
  if (hasMaturedScheme) {
    // At least one scheme has completed — allow withdrawal of any amount
    minWithdrawal = 0;
  } else if (allOrders.length === 0) {
    // No schemes at all — standard ₹200 minimum
    minWithdrawal = 200;
  } else if (!hasActiveBigScheme) {
    // Only small active schemes (<₹200) — waive the minimum once matured
    // (if still running, they must wait; but we don't block with ₹200)
    minWithdrawal = 0;
  }

  return {
    walletBalance: user.wallet_balance,
    lockedAmount,
    withdrawableBalance,
    minWithdrawal,
    hasActiveBigScheme,
    hasMaturedScheme
  };
}

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
      .populate({
        path: 'order_id',
        populate: { path: 'scheme_id' }
      })
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
      virtual_ifsc: t.virtual_account_id ? t.virtual_account_id.ifsc : null,
      utr: t.utr || null,
      screenshot: t.screenshot || null,
      withdrawal_bank_name: t.withdrawal_bank_name || null,
      withdrawal_account_name: t.withdrawal_account_name || null,
      withdrawal_account_number: t.withdrawal_account_number || null,
      withdrawal_ifsc: t.withdrawal_ifsc || null,
      withdrawal_upi_id: t.withdrawal_upi_id || null,
      wallet_balance_at_request: t.wallet_balance_at_request || 0,
      rejection_reason: t.rejection_reason || '',
      resolved_at: t.resolved_at || null,
      order_id: t.order_id ? t.order_id._id.toString() : null,
      scheme_name: t.scheme_name || (t.order_id && t.order_id.scheme_id ? t.order_id.scheme_id.name : (t.order_id ? 'Quick Deposit Scheme' : null)),
      referred_user_username: t.referred_user_username || null,
      referred_user_phone: t.referred_user_phone || null
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
    const now = new Date();

    if (type === 'deposit') {
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

      // Add a pending deposit transaction with snapshots
      const newTx = await Transaction.create({
        user_id: session.id,
        type: 'deposit',
        amount: reqAmount,
        status: 'pending',
        virtual_account_id: virtualAcc._id,
        deposit_bank_name: virtualAcc.bank_name,
        deposit_account_number: virtualAcc.account_number,
        deposit_beneficiary_name: virtualAcc.beneficiary_name,
        deposit_upi_id: virtualAcc.upi_id || "fastpay@upi",
        deposit_qr_code: virtualAcc.qr_code || ""
      });

      // Notify admin
      await createAdminNotification(session.id, reqAmount, 'Submitted new deposit');

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
          upiId: virtualAcc.upi_id || '',
          expiresAt: lockUntil.toISOString()
        }
      });

    } else if (type === 'withdrawal') {
      // Validate withdrawal amount is a multiple of 100
      if (reqAmount % 100 !== 0) {
        return NextResponse.json({
          error: "Withdrawal amount must be in multiples of ₹100 (₹100, ₹200, ₹300, ₹400...). Please enter a valid amount."
        }, { status: 400 });
      }

      // Enforce withdrawal eligibility: user must have at least one completed/matured scheme
      const userOrders = await Order.find({ user_id: session.id, status: { $in: ['active', 'expired_pending_match', 'completed'] } });
      const hasMaturedScheme = userOrders.some(order => order.days_remaining === 0 || order.status === 'expired_pending_match' || order.status === 'completed');
      if (!hasMaturedScheme) {
        return NextResponse.json({
          error: 'Withdrawals are temporarily unavailable. Withdrawals will be enabled automatically after your eligible investment scheme has matured.'
        }, { status: 400 });
      }

      // Check if user has linked their account details first
      const bankLinked = await BankDetails.findOne({ user_id: session.id });
      if (!bankLinked) {
        return NextResponse.json({ error: 'Please link your Bank/UPI details first in the Account section.' }, { status: 400 });
      }

      // Get smart withdrawal limits
      const limits = await getWalletWithdrawalLimit(session.id);

      if (limits.withdrawableBalance < reqAmount) {
        return NextResponse.json({ error: `Insufficient withdrawable balance. Your withdrawable balance is ₹${limits.withdrawableBalance.toFixed(2)} (Locked: ₹${limits.lockedAmount.toFixed(2)}).` }, { status: 400 });
      }

      if (reqAmount < limits.minWithdrawal) {
        return NextResponse.json({ error: `Minimum withdrawal amount is ₹${limits.minWithdrawal.toFixed(2)}.` }, { status: 400 });
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

      const balanceBefore = user.wallet_balance;
      // Deduct balance immediately upon request submission
      user.wallet_balance -= reqAmount;
      await user.save();

      // Parse bank name from IFSC
      const ifscPrefix = bankLinked.ifsc.substring(0, 4).toUpperCase();
      const friendlyBankMap = {
        'SBIN': 'State Bank of India',
        'HDFC': 'HDFC Bank',
        'ICIC': 'ICICI Bank',
        'UTIB': 'Axis Bank',
        'KKBK': 'Kotak Mahindra Bank',
        'BARB': 'Bank of Baroda',
        'PUNB': 'Punjab National Bank',
        'YESB': 'Yes Bank',
        'INDB': 'IndusInd Bank',
        'CNRB': 'Canara Bank',
        'IBKL': 'IDBI Bank',
        'IDFB': 'IDFC First Bank',
        'IOBA': 'Indian Overseas Bank',
        'UBIN': 'Union Bank of India'
      };
      const bankName = friendlyBankMap[ifscPrefix] || `${ifscPrefix} Bank`;

      // Add pending withdrawal request with snapshotted user data
      await Transaction.create({
        user_id: session.id,
        type: 'withdrawal',
        amount: -reqAmount,
        status: 'pending',
        utr: null,
        screenshot: null,
        user_username: user.username,
        user_phone: user.phone,
        withdrawal_bank_name: bankName,
        withdrawal_account_name: bankLinked.account_name,
        withdrawal_account_number: bankLinked.account_number,
        withdrawal_ifsc: bankLinked.ifsc,
        withdrawal_upi_id: bankLinked.upi_id,
        wallet_balance_at_request: balanceBefore
      });

      // Notify admin
      await createAdminNotification(session.id, reqAmount, 'Submitted withdrawal request');

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

// Update transaction with UTR and screenshot proof (Deposits)
export async function PATCH(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { transactionId, utr, screenshot } = await request.json();

    if (!transactionId || !utr || !screenshot) {
      return NextResponse.json({ error: 'Transaction ID, UTR, and payment screenshot are required.' }, { status: 400 });
    }

    const utrRegex = /^\d{12}$/;
    if (!utr || !utrRegex.test(utr.trim())) {
      return NextResponse.json({ error: 'Please enter a valid 12-digit UTR/Transaction Ref number.' }, { status: 400 });
    }

    // Check duplicate UTR in both Transactions and Orders
    const duplicateTx = await Transaction.findOne({ utr: utr.trim() });
    const duplicateOrder = await Order.findOne({ utr: utr.trim() });
    if (duplicateTx || duplicateOrder) {
      return NextResponse.json({ error: 'This UTR has already been submitted for verification.' }, { status: 400 });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }

    if (tx.status !== 'pending' || tx.type !== 'deposit') {
      return NextResponse.json({ error: 'Transaction cannot be updated.' }, { status: 400 });
    }

    tx.utr = utr.trim();
    tx.screenshot = await saveBase64Image(screenshot);
    tx.status = 'confirmation_pending';
    await tx.save();

    // Notify admin
    await createAdminNotification(session.id, tx.amount, 'Uploaded payment screenshot');

    // Custom Deposit Scheme auto-creation:
    // If the deposit amount is between ₹100 and ₹500 inclusive:
    if (tx.amount >= 100 && tx.amount <= 500) {
      // Check if an order already exists for this UTR to prevent double creation
      const existingOrder = await Order.findOne({ utr: utr.trim() });
      if (!existingOrder) {
        // Create custom dynamic investment scheme
        const customScheme = await Scheme.create({
          name: `Quick Deposit Scheme (₹${tx.amount})`,
          price: tx.amount,
          daily_return_rate: 0.035, // 3.5%
          days: 3,
          total_return: tx.amount * (1 + 0.035 * 3) // Principal + Profit
        });

        // Create pending order associated with the transaction
        const newOrder = await Order.create({
          user_id: tx.user_id,
          scheme_id: customScheme._id,
          price: tx.amount,
          daily_income: tx.amount * 0.035,
          total_payout: tx.amount * (1 + 0.035 * 3),
          days_remaining: 3,
          status: 'confirmation_pending',
          utr: utr.trim(),
          screenshot: tx.screenshot,
          virtual_account_id: tx.virtual_account_id
        });

        tx.order_id = newOrder._id;
        await tx.save();
      }
    }

    return NextResponse.json({ success: true, message: 'Deposit proof submitted successfully!' });
  } catch (error) {
    console.error('Submit deposit proof error:', error);
    return NextResponse.json({ error: 'Server error submitting deposit proof.' }, { status: 500 });
  }
}
