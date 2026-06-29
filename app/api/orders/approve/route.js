import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Order, Transaction, Scheme } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Verify session user exists and is an admin
    const currentUser = await User.findById(session.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const { orderId, action } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    // 1. Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order is already approved, rejected, or processed.' }, { status: 400 });
    }

    // Handle Order Rejection
    if (action === 'reject') {
      // 1. Update order status to 'rejected'
      order.status = 'rejected';
      await order.save();

      // 2. Mark the pending order_purchase transaction as failed
      await Transaction.updateOne(
        { user_id: order.user_id, type: 'order_purchase', amount: -order.price, status: 'pending' },
        { $set: { status: 'failed' } }
      );

      return NextResponse.json({
        success: true,
        message: `Order ID ${orderId} has been rejected.`
      });
    }

    // 2. Fetch or resolve scheme metadata
    let scheme;
    if (!order.scheme_id) {
      scheme = {
        name: 'Quick Deposit Scheme',
        price: order.price,
        daily_return_rate: 0.035,
        days: 3,
        total_return: order.price * (1 + 0.035 * 3)
      };
    } else {
      scheme = await Scheme.findById(order.scheme_id);
      if (!scheme) {
        return NextResponse.json({ error: 'Associated scheme not found.' }, { status: 404 });
      }
    }

    // 3. Fetch buyer details
    const buyer = await User.findById(order.user_id);
    if (!buyer) {
      return NextResponse.json({ error: 'Buyer user not found.' }, { status: 404 });
    }

    // Calculate first day's daily return yield immediately on approval
    const dailyYield = order.price * scheme.daily_return_rate;

    // Credit order price AND the first day's return yield directly to buyer's balance immediately!
    buyer.wallet_balance += (order.price + dailyYield);
    await buyer.save();

    // Approve the order, decrement days_remaining by 1 (since 1 day was paid), and set last_payout_at
    order.status = 'active';
    order.days_remaining = Math.max(0, scheme.days - 1);
    order.last_payout_at = new Date();
    await order.save();

    // Mark the pending order_purchase transaction as completed
    await Transaction.updateOne(
      { user_id: buyer._id, type: 'order_purchase', amount: -order.price, status: 'pending' },
      { $set: { status: 'completed' } }
    );

    // Create a transaction log for the first day's yield payout
    await Transaction.create({
      user_id: buyer._id,
      type: 'scheme_payout',
      amount: dailyYield,
      status: 'completed'
    });

    // Distribute referral commissions
    // Level A (0.3%)
    if (buyer.referred_by_id) {
      const levelA = await User.findById(buyer.referred_by_id);
      if (levelA) {
        const commL1 = order.price * 0.003; // 0.3%
        levelA.wallet_balance += commL1;
        await levelA.save();

        await Transaction.create({
          user_id: levelA._id,
          type: 'referral_commission_l1',
          amount: commL1,
          status: 'completed'
        });

        // Level B (0.15%)
        if (levelA.referred_by_id) {
          const levelB = await User.findById(levelA.referred_by_id);
          if (levelB) {
            const commL2 = order.price * 0.0015; // 0.15%
            levelB.wallet_balance += commL2;
            await levelB.save();

            await Transaction.create({
              user_id: levelB._id,
              type: 'referral_commission_l2',
              amount: commL2,
              status: 'completed'
            });
          }
        }
      }
    }

    // Crowdfunding Payout Matching Rule:
    // Match this incoming order amount against any expired schemes waiting for payout.
    let matchedMessage = '';
    const expiredOrder = await Order.findOne({ 
      status: 'expired_pending_match', 
      price: order.price 
    }).sort({ created_at: 1 }); // FIFO - oldest gets paid first

    if (expiredOrder) {
      const expiredUser = await User.findById(expiredOrder.user_id);
      if (expiredUser) {
        // Credit the expired user's balance with the principal return amount
        expiredUser.wallet_balance += order.price;
        await expiredUser.save();

        // Update expired order status
        expiredOrder.status = 'completed';
        expiredOrder.is_payout_matched = true;
        await expiredOrder.save();

        // Create principal return transaction log
        await Transaction.create({
          user_id: expiredUser._id,
          type: 'principal_return',
          amount: order.price,
          status: 'completed'
        });

        matchedMessage = ` Matches and pays out expired scheme for user: ${expiredUser.username}.`;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order ID ${orderId} has been successfully verified and activated.${matchedMessage}`
    });
  } catch (error) {
    console.error('Order approval error:', error);
    return NextResponse.json({ error: 'Failed to approve order due to server error.' }, { status: 500 });
  }
}
