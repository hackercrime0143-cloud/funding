import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Otp } from '@/lib/models';

export async function POST(request) {
  try {
    await connectDB();
    const { phone } = await request.json();

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
    }

    const now = new Date();

    // Find or initialize OTP record
    let otpRecord = await Otp.findOne({ phone });
    if (!otpRecord) {
      otpRecord = new Otp({ phone, otp_requests: [] });
    }

    // Cooldown check (60 seconds between requests)
    if (otpRecord.otp_requests && otpRecord.otp_requests.length > 0) {
      const lastRequest = new Date(otpRecord.otp_requests[otpRecord.otp_requests.length - 1]);
      const timeSinceLast = now.getTime() - lastRequest.getTime();
      const cooldownMs = 60 * 1000;
      if (timeSinceLast < cooldownMs) {
        const secondsRemaining = Math.ceil((cooldownMs - timeSinceLast) / 1000);
        return NextResponse.json({ 
          error: `Please wait ${secondsRemaining} seconds before requesting a new OTP.` 
        }, { status: 429 });
      }
    }

    // Generate a 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes expiry

    // Update OTP record
    otpRecord.code = otpCode;
    otpRecord.expires_at = expiresAt;
    otpRecord.otp_requests.push(now);
    await otpRecord.save();

    console.log(`[FastPay OTP] Phone: ${phone} -> Code: ${otpCode}`);

    // Fast2SMS Integration
    const apiKey = process.env.FAST2SMS_API_KEY;
    let smsSent = false;
    let apiError = '';

    if (apiKey) {
      try {
        const smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=q&message=${encodeURIComponent(`Your FastPay verification OTP code is ${otpCode}. Valid for 5 minutes.`)}&numbers=${encodeURIComponent(phone)}`;
        const smsResponse = await fetch(smsUrl);
        const smsData = await smsResponse.json();
        console.log('[FastPay Fast2SMS API Response]', smsData);
        if (smsData && smsData.return === true) {
          smsSent = true;
        } else {
          apiError = smsData.message || JSON.stringify(smsData);
        }
      } catch (smsErr) {
        console.error('[FastPay Fast2SMS API Error]', smsErr);
        apiError = smsErr.message;
      }
    }

    if (smsSent) {
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully to your phone number via SMS.'
      });
    } else {
      if (apiKey) {
        return NextResponse.json({
          error: `SMS delivery failed (${apiError}). Please try again later.`
        }, { status: 500 });
      } else {
        return NextResponse.json({
          success: true,
          message: 'OTP generated. Displaying demo code (define FAST2SMS_API_KEY in .env for real SMS).',
          otp: otpCode
        });
      }
    }
  } catch (error) {
    console.error('OTP generation error:', error);
    return NextResponse.json({ error: 'Failed to send OTP.' }, { status: 500 });
  }
}
