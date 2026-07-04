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
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find or initialize OTP record
    let otpRecord = await Otp.findOne({ phone });
    if (!otpRecord) {
      otpRecord = new Otp({ phone, otp_requests: [] });
    }

    // Filter requests in the last 24 hours
    const recentRequests = otpRecord.otp_requests.filter(reqTime => new Date(reqTime) >= cutoff24h);

    if (recentRequests.length >= 2) {
      return NextResponse.json({ 
        error: 'Please try again after 24 hours.' 
      }, { status: 429 });
    }

    // Generate a 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now.getTime() + 60 * 1000); // 60 seconds expiry

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
        const smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=q&message=${encodeURIComponent(`Your FastPay verification OTP code is ${otpCode}. Valid for 1 minute.`)}&numbers=${encodeURIComponent(phone)}`;
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
