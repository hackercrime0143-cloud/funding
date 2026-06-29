import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { signToken, setCookieHeader } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required.' }, { status: 400 });
    }

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid phone number or password.' }, { status: 400 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid phone number or password.' }, { status: 400 });
    }

    if (user.is_suspended) {
      return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
    }

    const token = signToken({ id: user._id.toString(), phone: user.phone, username: user.username });
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        phone: user.phone,
        email: user.email,
        role: user.role || 'user',
        referralCode: user.referral_code,
        walletBalance: user.wallet_balance
      }
    });

    response.headers.set('Set-Cookie', setCookieHeader(token));
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed due to server error.' }, { status: 500 });
  }
}
