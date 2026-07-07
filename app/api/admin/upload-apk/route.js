import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Settings } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Verify admin role
    const adminCheck = await User.findById(session.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const filename = file.name || 'FastPay.apk';

    // Verify file extension is .apk
    if (!filename.toLowerCase().endsWith('.apk')) {
      return NextResponse.json({ error: 'Invalid file type. Only files ending with the ".apk" extension are allowed.' }, { status: 400 });
    }

    // Read arrayBuffer from file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Define storage path in apk-store
    const uploadDir = path.join(process.cwd(), 'apk-store');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Save download URL to Settings
    const downloadUrl = `/download/${filename}`;
    await Settings.findOneAndUpdate(
      { key: 'apk_download_url' },
      { value: downloadUrl },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `APK file uploaded successfully as "${filename}"!`,
      downloadUrl
    });
  } catch (error) {
    console.error('[APK Upload API Error]', error);
    return NextResponse.json({ error: 'Failed to upload APK file: ' + error.message }, { status: 500 });
  }
}
