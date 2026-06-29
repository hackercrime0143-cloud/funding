import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Scheme, Transaction, VirtualAccount, Order } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
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

    const { action, payload } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400 });
    }

    if (action === 'addScheme') {
      const { name, price, dailyReturnRate, days, totalReturn } = payload;
      if (!name || !price || !dailyReturnRate || !days || !totalReturn) {
        return NextResponse.json({ error: 'All fields are required to create a scheme.' }, { status: 400 });
      }

      const rateFraction = parseFloat(dailyReturnRate) >= 1 ? parseFloat(dailyReturnRate) / 100 : parseFloat(dailyReturnRate);

      await Scheme.create({
        name: name.trim(),
        price: parseFloat(price),
        daily_return_rate: rateFraction,
        days: parseInt(days),
        total_return: parseFloat(totalReturn)
      });

      return NextResponse.json({ success: true, message: `Investment scheme "${name}" created successfully!` });
    } 
    
    else if (action === 'deleteScheme') {
      const { schemeId } = payload;
      if (!schemeId) {
        return NextResponse.json({ error: 'Scheme ID is required.' }, { status: 400 });
      }

      await Scheme.deleteOne({ _id: schemeId });
      return NextResponse.json({ success: true, message: 'Investment scheme deleted successfully.' });
    }
    
    else if (action === 'editScheme') {
      const { schemeId, name, price, dailyReturnRate, days, totalReturn } = payload;
      if (!schemeId || !name || !price || !dailyReturnRate || !days || !totalReturn) {
        return NextResponse.json({ error: 'All fields are required to edit a scheme.' }, { status: 400 });
      }

      const rateFraction = parseFloat(dailyReturnRate) >= 1 ? parseFloat(dailyReturnRate) / 100 : parseFloat(dailyReturnRate);

      await Scheme.updateOne(
        { _id: schemeId },
        { 
          $set: {
            name: name.trim(),
            price: parseFloat(price),
            daily_return_rate: rateFraction,
            days: parseInt(days),
            total_return: parseFloat(totalReturn)
          } 
        }
      );

      return NextResponse.json({ success: true, message: `Investment scheme "${name}" updated successfully!` });
    }
    
    else if (action === 'approveTransaction') {
      const { transactionId } = payload;
      if (!transactionId) {
        return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
      }

      const tx = await Transaction.findById(transactionId);
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
      }

      if (tx.status !== 'pending') {
        return NextResponse.json({ error: 'Transaction is already processed.' }, { status: 400 });
      }

      // Complete the transaction
      tx.status = 'completed';
      await tx.save();

      // If it's a deposit, check if it was a Custom Scheme deposit or a normal deposit
      if (tx.type === 'deposit') {
        if (tx.amount >= 100 && tx.amount <= 500) {
          // Activate the custom scheme purchase order associated with the UTR
          await Order.updateOne(
            { user_id: tx.user_id, utr: tx.utr, status: 'pending' },
            { $set: { status: 'active', last_payout_at: new Date() } }
          );
        } else {
          // Normal deposit credits the user's wallet balance
          await User.updateOne(
            { _id: tx.user_id },
            { $inc: { wallet_balance: tx.amount } }
          );
        }
        
        // Also unlock any associated virtual accounts
        if (tx.virtual_account_id) {
          await VirtualAccount.updateOne(
            { _id: tx.virtual_account_id },
            { $set: { is_locked: false, locked_until: null, locked_by_user_id: null } }
          );
        }
      }

      return NextResponse.json({ success: true, message: 'Transaction approved successfully.' });
    } 
    
    else if (action === 'rejectTransaction') {
      const { transactionId } = payload;
      if (!transactionId) {
        return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
      }

      const tx = await Transaction.findById(transactionId);
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
      }

      if (tx.status !== 'pending') {
        return NextResponse.json({ error: 'Transaction is already processed.' }, { status: 400 });
      }

      // Fail the transaction
      tx.status = 'failed';
      await tx.save();

      // If it's a deposit & custom scheme range, reject the custom order
      if (tx.type === 'deposit' && tx.amount >= 100 && tx.amount <= 500) {
        await Order.updateOne(
          { user_id: tx.user_id, utr: tx.utr, status: 'pending' },
          { $set: { status: 'rejected' } }
        );
      }

      // If it's a withdrawal, refund user wallet balance (since we deduct it upon request)
      if (tx.type === 'withdrawal') {
        const refundAmount = Math.abs(tx.amount);
        await User.updateOne(
          { _id: tx.user_id },
          { $inc: { wallet_balance: refundAmount } }
        );
      }

      // If it's a deposit, unlock the virtual account
      if (tx.type === 'deposit' && tx.virtual_account_id) {
        await VirtualAccount.updateOne(
          { _id: tx.virtual_account_id },
          { $set: { is_locked: false, locked_until: null, locked_by_user_id: null } }
        );
      }

      return NextResponse.json({ success: true, message: 'Transaction rejected successfully.' });
    }

    else if (action === 'suspendUser') {
      const { userId } = payload;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
      }
      const target = await User.findById(userId);
      if (!target) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
      if (target.role === 'admin') {
        return NextResponse.json({ error: 'Cannot suspend an admin account.' }, { status: 403 });
      }
      await User.updateOne({ _id: userId }, { $set: { is_suspended: true } });
      return NextResponse.json({ success: true, message: `Account of "${target.username}" has been suspended.` });
    }

    else if (action === 'unsuspendUser') {
      const { userId } = payload;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
      }
      const target = await User.findById(userId);
      if (!target) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
      await User.updateOne({ _id: userId }, { $set: { is_suspended: false } });
      return NextResponse.json({ success: true, message: `Account of "${target.username}" has been reactivated.` });
    }

    return NextResponse.json({ error: 'Invalid admin action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Failed to complete admin action.' }, { status: 500 });
  }
}
