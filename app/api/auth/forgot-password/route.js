import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Otp } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { signToken, setCookieHeader } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { phone, otp, password } = await request.json();

    if (!phone || !otp || !password) {
      return NextResponse.json({ error: 'All fields (Phone, OTP, and New Password) are required.' }, { status: 400 });
    }

    // 1. Check if user exists
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return NextResponse.json({ error: 'Phone number not registered.' }, { status: 400 });
    }

    // 2. Verify OTP
    const otpRecord = await Otp.findOne({ phone: phone.trim() });
    if (!otpRecord) {
      return NextResponse.json({ error: 'No OTP generated for this phone number.' }, { status: 400 });
    }

    const now = new Date();
    if (otpRecord.code !== otp) {
      return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 400 });
    }
    if (now > new Date(otpRecord.expires_at)) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Delete verified OTP to prevent reuse
    await Otp.deleteOne({ phone: phone.trim() });

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Update user password
    user.password = hashedPassword;
    await user.save();

    // 5. Auto-login user after successful reset
    const token = signToken({ id: user._id.toString(), phone: user.phone, username: user.username });
    const response = NextResponse.json({
      success: true,
      message: 'Password reset successfully.',
      user: {
        id: user._id.toString(),
        username: user.username,
        phone: user.phone,
        email: user.email,
        referralCode: user.referral_code,
        walletBalance: user.wallet_balance
      }
    });

    response.headers.set('Set-Cookie', setCookieHeader(token));
    return response;
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password due to server error.' }, { status: 500 });
  }
}
