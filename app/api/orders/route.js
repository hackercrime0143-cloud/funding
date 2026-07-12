import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Order, Scheme, Transaction, VirtualAccount, createAdminNotification } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';
import { saveBase64Image } from '@/lib/upload';

// Helper to auto-cancel pending orders that are drafts (start with DRAFT-) older than 15 minutes
async function autoCancelPendingOrders() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const ordersToCancel = await Order.find({
    status: 'pending',
    utr: { $regex: /^DRAFT-/ },
    created_at: { $lt: fifteenMinutesAgo }
  });

  if (ordersToCancel.length > 0) {
    const orderIds = ordersToCancel.map(o => o._id);
    const vaIds = ordersToCancel.map(o => o.virtual_account_id).filter(Boolean);

    await Order.updateMany(
      { _id: { $in: orderIds } },
      { status: 'cancelled' }
    );

    if (vaIds.length > 0) {
      await VirtualAccount.updateMany(
        { _id: { $in: vaIds } },
        { $set: { is_locked: false, locked_until: null, locked_by_user_id: null } }
      );
    }
  }
}

// Fetch user's orders
export async function GET(request) {
  try {
    await connectDB();
    await autoCancelPendingOrders();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const ords = await Order.find({ user_id: session.id })
      .populate('scheme_id')
      .populate('virtual_account_id')
      .sort({ created_at: -1 });

    const orders = ords.map(o => ({
      id: o._id.toString(),
      user_id: o.user_id.toString(),
      scheme_id: o.scheme_id ? o.scheme_id._id.toString() : null,
      scheme_id_raw: o.scheme_id ? o.scheme_id._id.toString() : null,
      scheme_name: o.scheme_id ? o.scheme_id.name : 'Unknown Scheme',
      price: o.price,
      daily_income: o.daily_income,
      total_payout: o.total_payout,
      days_remaining: o.days_remaining,
      last_payout_at: o.last_payout_at,
      created_at: o.created_at,
      status: o.status,
      utr: o.utr,
      screenshot: o.screenshot,
      virtual_account: null,
      virtual_bank: null,
      virtual_beneficiary: null,
      virtual_ifsc: null,
      virtual_upi: o.virtual_account_id ? o.virtual_account_id.upi_id : null,
      virtual_qr_code: o.virtual_account_id ? o.virtual_account_id.qr_code : null
    }));

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
}

// Purchase/Subscribe to a scheme (Creates Draft if isDraft: true)
export async function POST(request) {
  try {
    await connectDB();
    await autoCancelPendingOrders();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const requestData = await request.json();
    const { schemeId, utr, screenshot, isDraft, paymentMethod } = requestData;

    if (!schemeId) {
      return NextResponse.json({ error: 'Scheme ID is required.' }, { status: 400 });
    }

    let scheme;
    let dailyIncome;
    if (schemeId === 'custom_deposit_scheme') {
      const customPrice = parseFloat(requestData.price);
      if (isNaN(customPrice) || customPrice <= 0) {
        return NextResponse.json({ error: 'Invalid deposit amount.' }, { status: 400 });
      }
      scheme = {
        _id: null,
        name: 'Quick Deposit Scheme',
        price: customPrice,
        daily_return_rate: 0.035, // 3.5%
        days: 3,
        total_return: customPrice * (1 + 0.035 * 3)
      };
      dailyIncome = customPrice * 0.035;
    } else {
      scheme = await Scheme.findById(schemeId);
      if (!scheme) {
        return NextResponse.json({ error: 'Scheme not found.' }, { status: 404 });
      }
      dailyIncome = scheme.price * scheme.daily_return_rate;
    }

    // --- 24-HOUR SAME-SCHEME COOLDOWN ---
    // Skip cooldown for custom deposit schemes (they use price not scheme_id)
    if (schemeId !== 'custom_deposit_scheme' && scheme._id) {
      const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentOrder = await Order.findOne({
        user_id: session.id,
        scheme_id: scheme._id,
        status: { $in: ['active', 'expired_pending_match', 'completed', 'confirmation_pending'] },
        created_at: { $gt: cutoff24h }
      }).sort({ created_at: -1 });

      if (recentOrder) {
        const cooldownUntil = new Date(new Date(recentOrder.created_at).getTime() + 24 * 60 * 60 * 1000);
        return NextResponse.json({
          error: `You already purchased this scheme. You can buy it again after ${cooldownUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tomorrow.`,
          cooldownUntil: cooldownUntil.toISOString()
        }, { status: 429 });
      }
    }

    if (paymentMethod === 'wallet') {
      return NextResponse.json({ error: 'Wallet payments are no longer supported. Please pay using Bank/UPI/QR code.' }, { status: 400 });
    }

    if (isDraft) {
      // Ensure there are no duplicate pending payments created for the same purchase
      const existingPending = await Order.findOne({
        user_id: session.id,
        scheme_id: schemeId === 'custom_deposit_scheme' ? null : scheme._id,
        status: 'pending',
        price: scheme.price,
        utr: { $regex: /^DRAFT-/ }
      });

      if (existingPending) {
        const matchedVa = await VirtualAccount.findById(existingPending.virtual_account_id);
        return NextResponse.json({
          success: true,
          orderId: existingPending._id.toString(),
          createdAt: existingPending.created_at,
          depositDetails: matchedVa ? {
            upiId: matchedVa.upi_id || "",
            qrCode: matchedVa.qr_code || ""
          } : {
            upiId: "",
            qrCode: ""
          }
        });
      }
    }

    let finalUtr = utr;
    let initialStatus = 'pending';

    if (isDraft) {
      // Create a unique temporary UTR for the draft order
      finalUtr = `DRAFT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      if (!screenshot) {
        return NextResponse.json({ error: 'Payment screenshot is required.' }, { status: 400 });
      }

      const utrRegex = /^\d{12}$/;
      if (!utr || !utrRegex.test(utr.trim())) {
        return NextResponse.json({ error: 'Please enter a valid 12-digit UTR/Transaction Ref number.' }, { status: 400 });
      }

      // Check duplicate UTR
      const duplicateUtr = await Order.findOne({ utr: utr.trim() });
      if (duplicateUtr) {
        return NextResponse.json({ error: 'This UTR has already been submitted for verification.' }, { status: 400 });
      }

      finalUtr = utr.trim();
    }

    // Select dynamic virtual account (bank details rotation)
    const now = new Date();
    const lockDurationMs = 15 * 60 * 1000;
    const lockUntil = new Date(now.getTime() + lockDurationMs);

    let virtualAcc = null;

    // 1. Find enabled accounts that are available (not locked, locked expired, locked by current user, or allow concurrent)
    virtualAcc = await VirtualAccount.findOne({
      is_enabled: { $ne: false },
      $or: [
        { is_locked: false },
        { locked_until: { $lt: now } },
        { locked_by_user_id: session.id },
        { allow_concurrent: true }
      ]
    }).sort({ last_assigned_at: 1 }); // Round-robin: oldest assigned first

    // 3. If no available account, check if any enabled account allows concurrent usage
    if (!virtualAcc) {
      virtualAcc = await VirtualAccount.findOne({
        is_enabled: { $ne: false },
        allow_concurrent: true
      }).sort({ last_assigned_at: 1 });
    }

    // If still no account is available, return an error (prevent sharing locked accounts)
    if (!virtualAcc) {
      return NextResponse.json({
        error: 'No payment accounts are currently available. Please try again in a few minutes.'
      }, { status: 409 });
    }

    // Lock and save
    virtualAcc.is_locked = true;
    virtualAcc.locked_until = lockUntil;
    virtualAcc.locked_by_user_id = session.id;
    virtualAcc.last_assigned_at = now;
    await virtualAcc.save();

    // Save screenshot to disk if provided
    let screenshotUrl = null;
    if (screenshot) {
      screenshotUrl = await saveBase64Image(screenshot);
    }

    // Create order
    const newOrder = await Order.create({
      user_id: session.id,
      scheme_id: scheme._id,
      price: scheme.price,
      daily_income: dailyIncome,
      total_payout: scheme.total_return,
      days_remaining: scheme.days,
      status: initialStatus,
      utr: finalUtr,
      screenshot: screenshotUrl,
      virtual_account_id: virtualAcc._id
    });

    // Create corresponding deposit transaction
    await Transaction.create({
      user_id: session.id,
      order_id: newOrder._id,
      type: 'deposit',
      amount: scheme.price,
      status: initialStatus,
      virtual_account_id: virtualAcc._id,
      utr: finalUtr,
      screenshot: screenshotUrl,
      deposit_bank_name: virtualAcc.bank_name,
      deposit_account_number: virtualAcc.account_number,
      deposit_beneficiary_name: virtualAcc.beneficiary_name,
      deposit_upi_id: virtualAcc.upi_id || "",
      deposit_qr_code: virtualAcc.qr_code || "",
      created_at: newOrder.created_at,
      updated_at: newOrder.created_at
    });

    const fallbackVa = {
      upiId: "",
      qrCode: ""
    };

    return NextResponse.json({
      success: true,
      message: isDraft ? 'Draft order created.' : `Purchase request submitted for verification with UTR: ${utr.trim()}.`,
      orderId: newOrder._id.toString(),
      createdAt: newOrder.created_at,
      depositDetails: virtualAcc ? {
        upiId: virtualAcc.upi_id || "",
        qrCode: virtualAcc.qr_code || ""
      } : fallbackVa
    });
  } catch (error) {
    console.error('Order purchase/draft error:', error);
    return NextResponse.json({ error: 'Failed to process purchase.' }, { status: 500 });
  }
}

// Update Draft Order Status / details (Close modal, timer expiry, or final UTR submit)
export async function PATCH(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { orderId, status, utr, screenshot } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Security Check: Verify ownership
    if (order.user_id.toString() !== session.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (status) {
      order.status = status;
      if (['cancelled', 'failed', 'rejected', 'completed'].includes(status) && order.virtual_account_id) {
        await VirtualAccount.updateOne(
          { _id: order.virtual_account_id },
          { $set: { is_locked: false, locked_until: null, locked_by_user_id: null } }
        );
      }
    }

    if (utr) {
      const utrRegex = /^\d{12}$/;
      if (!utrRegex.test(utr.trim())) {
        return NextResponse.json({ error: 'Please enter a valid 12-digit UTR.' }, { status: 400 });
      }

      // Check duplicate UTR (excluding self)
      const duplicateUtr = await Order.findOne({ utr: utr.trim(), _id: { $ne: order._id } });
      if (duplicateUtr) {
        return NextResponse.json({ error: 'This UTR has already been submitted for verification.' }, { status: 400 });
      }

      order.utr = utr.trim();
    }

    if (screenshot) {
      order.screenshot = await saveBase64Image(screenshot);
      // Notify admin
      await createAdminNotification(session.id, order.price, 'Uploaded payment screenshot');
    }

    await order.save();

    if (status === 'confirmation_pending') {
      // Notify admin
      await createAdminNotification(session.id, order.price, 'Purchased new scheme');
    }

    // Sync changes to the associated deposit transaction
    const updateFields = {};
    if (status) {
      updateFields.status = status;
    }
    if (utr) {
      updateFields.utr = utr.trim();
    }
    if (screenshot) {
      updateFields.screenshot = order.screenshot;
    }
    if (Object.keys(updateFields).length > 0) {
      updateFields.updated_at = new Date();
      await Transaction.updateOne({ order_id: order._id }, { $set: updateFields });
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully.'
    });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order details.' }, { status: 500 });
  }
}
