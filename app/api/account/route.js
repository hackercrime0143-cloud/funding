import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { BankDetails } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { accountNumber, accountName, ifsc, upiId } = await request.json();

    if (!accountNumber || !accountName || !ifsc || !upiId) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // 1. Account Number verification
    // Must be numeric only and between 9 and 18 digits.
    const accNumRegex = /^\d{9,18}$/;
    if (!accNumRegex.test(accountNumber.trim())) {
      return NextResponse.json({ error: 'Invalid Account Number. Must be numeric and between 9 and 18 digits.' }, { status: 400 });
    }

    // 2. Account Name verification
    // Must be at least 3 letters, alphabetic and space only.
    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    if (!nameRegex.test(accountName.trim())) {
      return NextResponse.json({ error: 'Invalid Account Name. Must be at least 3 characters and only contain letters.' }, { status: 400 });
    }

    // 3. IFSC Verification (e.g. SBIN0012345)
    // Rule: 4 letters, 1 zero, 6 alphanumeric/digits
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc.trim().toUpperCase())) {
      return NextResponse.json({ error: 'Invalid IFSC Code format. Must be like SBIN0012345.' }, { status: 400 });
    }

    // 4. UPI ID Verification
    // Rule: user@bankname
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId.trim())) {
      return NextResponse.json({ error: 'Invalid UPI ID format. E.g. name@upi.' }, { status: 400 });
    }

    // Upsert bank details
    await BankDetails.findOneAndUpdate(
      { user_id: session.id },
      { 
        account_number: accountNumber.trim(), 
        account_name: accountName.trim(), 
        ifsc: ifsc.trim().toUpperCase(), 
        upi_id: upiId.trim(),
        updated_at: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Bank details linked and verified successfully.'
    });
  } catch (error) {
    console.error('Save bank details error:', error);
    return NextResponse.json({ error: 'Failed to update bank details.' }, { status: 500 });
  }
}
