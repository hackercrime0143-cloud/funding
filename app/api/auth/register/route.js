import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Otp, Transaction } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { signToken, setCookieHeader } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { username, phone, email, password, otp, referralCode } = await request.json();

    if (!username || !phone || !email || !password || !otp) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Strict Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    // Block disposable/fake email domains
    const fakeDomains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email', 'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'spam4.me', 'trashmail.com', 'maildrop.cc', 'mailnull.com', 'dispostable.com', 'fakeinbox.com'];
    const emailDomain = email.trim().toLowerCase().split('@')[1];
    if (fakeDomains.includes(emailDomain)) {
      return NextResponse.json({ error: 'Disposable or fake email addresses are not allowed. Please use a real email.' }, { status: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.' }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.trim())) {
      return NextResponse.json({ error: 'Username must be 3-20 characters long and alphanumeric.' }, { status: 400 });
    }

    // Security Check: Block reserved admin usernames
    const lowerUsername = username.trim().toLowerCase();
    if (lowerUsername === 'admin' || lowerUsername === 'atifk') {
      return NextResponse.json({ 
        error: 'This username is reserved and cannot be registered. Choose a different username.' 
      }, { status: 400 });
    }

    // 1. Verify OTP
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

    // 2. Check duplicate email or phone or username
    const existingUser = await User.findOne({
      $or: [
        { phone: phone.trim() },
        { email: email.trim().toLowerCase() },
        { username: username.trim() }
      ]
    });
    if (existingUser) {
      if (existingUser.phone === phone.trim()) {
        return NextResponse.json({ error: 'Phone number already registered.' }, { status: 400 });
      }
      if (existingUser.email === email.trim().toLowerCase()) {
        return NextResponse.json({ error: 'Email address already registered.' }, { status: 400 });
      }
      if (existingUser.username === username.trim()) {
        return NextResponse.json({ error: 'Username is already taken.' }, { status: 400 });
      }
    }

    // 3. Check referrer (if code provided)
    let referrer = null;
    if (referralCode && referralCode.trim() !== '') {
      referrer = await User.findOne({ referral_code: referralCode.trim().toUpperCase() });
      if (!referrer) {
        return NextResponse.json({ error: 'Invalid referral code.' }, { status: 400 });
      }
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Generate unique referral code for the new user
    const userReferralCode = 'FP' + Math.floor(100000 + Math.random() * 900000).toString();

    // 5b. Generate unique 6-digit Support ID
    let supportId = '';
    let supportIdUnique = false;
    while (!supportIdUnique) {
      const candidate = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await User.findOne({ support_id: candidate });
      if (!existing) {
        supportId = candidate;
        supportIdUnique = true;
      }
    }

    // 6. Calculate starting balance
    // Registration welcome balance is always ₹100
    const initialBalance = 100.0;

    // 7. Create User
    const newUser = await User.create({
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      referral_code: userReferralCode,
      support_id: supportId,
      referred_by_id: referrer ? referrer._id : null,
      wallet_balance: initialBalance,
      role: 'user'
    });

    // Log signup welcome bonus transaction (₹100)
    await Transaction.create({
      user_id: newUser._id,
      type: 'referral_bonus_signup',
      amount: 100.0,
      status: 'completed'
    });

    if (referrer) {
      // Credit referrer ₹50
      await User.updateOne(
        { _id: referrer._id },
        { $inc: { wallet_balance: 50.0 } }
      );

      // Add transaction log for referrer (₹50)
      await Transaction.create({
        user_id: referrer._id,
        type: 'referral_bonus_invited',
        amount: 50.0,
        status: 'completed'
      });
    }

    // Create session token
    const token = signToken({ id: newUser._id.toString(), phone: newUser.phone, username: newUser.username });
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        phone: newUser.phone,
        email: newUser.email,
        role: 'user',
        referralCode: userReferralCode,
        walletBalance: initialBalance
      }
    });

    response.headers.set('Set-Cookie', setCookieHeader(token));
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed due to server error.' }, { status: 500 });
  }
}
