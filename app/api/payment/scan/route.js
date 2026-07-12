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

    // Extract the tr parameter (QR Token) if it exists in the scanned UPI URL
    const trMatch = trimmedText.match(/[?&]tr=([^&]+)/i);
    const qrToken = trMatch ? decodeURIComponent(trMatch[1]).trim() : null;

    if (!qrToken) {
      return NextResponse.json({ error: 'This payment QR has expired or has already been used. Please create a new order.' }, { status: 400 });
    }

    // Find the corresponding order
    const order = await Order.findOne({ qr_token: qrToken });
    if (!order) {
      return NextResponse.json({ error: 'This payment QR has expired or has already been used. Please create a new order.' }, { status: 400 });
    }

    // Check ownership
    if (order.user_id.toString() !== session.id) {
      return NextResponse.json({ error: 'This payment QR has expired or has already been used. Please create a new order.' }, { status: 400 });
    }

    // Check expiry
    const now = new Date();
    if (order.qr_status === 'expired' || (order.qr_status === 'pending' && order.qr_expiry_at && order.qr_expiry_at < now)) {
      order.qr_status = 'expired';
      order.status = 'cancelled';
      await order.save();
      return NextResponse.json({ error: 'This payment QR has expired or has already been used. Please create a new order.' }, { status: 400 });
    }

    // Check status
    if (order.qr_status === 'cancelled' || order.qr_status === 'paid') {
      return NextResponse.json({ error: 'This payment QR has expired or has already been used. Please create a new order.' }, { status: 400 });
    }

    // Check if the order is already confirmation pending or completed
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'This payment QR has expired or has already been used. Please create a new order.' }, { status: 400 });
    }

    const virtualAcc = await VirtualAccount.findById(order.virtual_account_id);
    if (!virtualAcc || !virtualAcc.is_enabled) {
      return NextResponse.json({ error: 'This payment QR has expired or has already been used. Please create a new order.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId: order._id.toString(),
      amount: order.price,
      createdAt: order.created_at,
      depositDetails: {
        qrCode: virtualAcc.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(trimmedText)}`
      }
    });

  } catch (error) {
    console.error('Scan payment error:', error);
    return NextResponse.json({ error: 'Failed to process scanned QR code.' }, { status: 500 });
  }
}
