import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Order, Transaction, VirtualAccount, UsedQrCode } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { scannedText } = await request.json();
    if (!scannedText || typeof scannedText !== 'string') {
      return NextResponse.json({ error: 'Scanned text is required.' }, { status: 400 });
    }

    const trimmedText = scannedText.trim();

    // Extract UPI ID from scanned text if it's a UPI link
    let upiId = null;
    const upiIdMatch = trimmedText.match(/pa=([^&]+)/i);
    if (upiIdMatch) {
      upiId = decodeURIComponent(upiIdMatch[1]).trim();
    }

    // Check if the QR code/UPI ID is in UsedQrCode
    const alreadyUsed = await UsedQrCode.findOne({
      $or: [
        { qr_code_content: trimmedText },
        ...(upiId ? [{ qr_code_content: new RegExp(upiId, 'i') }] : [])
      ]
    });
    if (alreadyUsed) {
      return NextResponse.json({ error: 'QR Code Already Used' }, { status: 400 });
    }

    // Check if there is a matching disabled account
    const disabledAcc = await VirtualAccount.findOne({
      $or: [
        { qr_code_data: trimmedText },
        ...(upiId ? [{ upi_id: { $regex: new RegExp(`^${upiId}$`, 'i') } }] : []),
        { upi_id: { $regex: new RegExp(`^${trimmedText}$`, 'i') } }
      ],
      is_enabled: false
    });
    if (disabledAcc) {
      return NextResponse.json({ error: 'QR Code Already Used' }, { status: 400 });
    }

    // Find matched active virtual account
    let virtualAcc = null;
    if (upiId) {
      virtualAcc = await VirtualAccount.findOne({
        upi_id: { $regex: new RegExp(`^${upiId}$`, 'i') },
        is_enabled: true
      });
    }

    if (!virtualAcc) {
      virtualAcc = await VirtualAccount.findOne({
        qr_code_data: trimmedText,
        is_enabled: true
      });
    }

    if (!virtualAcc) {
      virtualAcc = await VirtualAccount.findOne({
        upi_id: { $regex: new RegExp(`^${trimmedText}$`, 'i') },
        is_enabled: true
      });
    }

    if (!virtualAcc) {
      return NextResponse.json({ error: 'Invalid QR Code' }, { status: 400 });
    }

    // 4. Look up existing active draft order
    let order = await Order.findOne({
      user_id: session.id,
      virtual_account_id: virtualAcc._id,
      status: 'pending'
    });

    let amount = order ? order.price : null;

    if (!order) {
      // Parse amount from scanned URI
      const amountMatch = trimmedText.match(/am=([^&]+)/i);
      const parsedAmount = amountMatch ? parseFloat(amountMatch[1]) : null;
      if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: 'Invalid QR Code: No valid payment amount found.' }, { status: 400 });
      }
      amount = parsedAmount;

      // Create new draft order for Quick Deposit Scheme
      const dailyIncome = amount * 0.035;
      const now = new Date();
      const lockDurationMs = 15 * 60 * 1000;
      
      // Lock Virtual Account
      virtualAcc.is_locked = true;
      virtualAcc.locked_until = new Date(now.getTime() + lockDurationMs);
      virtualAcc.locked_by_user_id = session.id;
      virtualAcc.last_assigned_at = now;
      await virtualAcc.save();

      const finalUtr = `DRAFT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      order = await Order.create({
        user_id: session.id,
        scheme_id: null, // Custom/Quick Deposit Scheme
        price: amount,
        daily_income: dailyIncome,
        total_payout: amount * (1 + 0.035 * 3),
        days_remaining: 3,
        status: 'pending',
        utr: finalUtr,
        virtual_account_id: virtualAcc._id
      });

      // Create transaction
      await Transaction.create({
        user_id: session.id,
        order_id: order._id,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        virtual_account_id: virtualAcc._id,
        utr: finalUtr,
        deposit_bank_name: virtualAcc.bank_name,
        deposit_account_number: virtualAcc.account_number,
        deposit_beneficiary_name: virtualAcc.beneficiary_name,
        deposit_upi_id: virtualAcc.upi_id || "",
        deposit_qr_code: virtualAcc.qr_code || "",
        created_at: order.created_at,
        updated_at: order.created_at
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order._id.toString(),
      amount: amount,
      createdAt: order.created_at,
      depositDetails: {
        upiId: virtualAcc.upi_id || "",
        qrCode: virtualAcc.qr_code || ""
      }
    });

  } catch (error) {
    console.error('Scan payment error:', error);
    return NextResponse.json({ error: 'Failed to process scanned QR code.' }, { status: 500 });
  }
}
