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

    // Define storage path in downloads folder
    const uploadDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Get current version and increment it
    const currentVersionSetting = await Settings.findOne({ key: 'pwa_version' });
    const currentVersion = currentVersionSetting ? currentVersionSetting.value : '1.0.0';
    
    // Auto-increment version helper
    const incrementVersion = (versionStr) => {
      if (!versionStr) return '1.0.1';
      const parts = versionStr.split('.');
      if (parts.length === 3) {
        const patch = parseInt(parts[2], 10);
        if (!isNaN(patch)) {
          parts[2] = (patch + 1).toString();
          return parts.join('.');
        }
      }
      const num = parseFloat(versionStr);
      if (!isNaN(num)) {
        return (num + 0.1).toFixed(2);
      }
      return versionStr + '_new';
    };

    const newVersion = incrementVersion(currentVersion);

    // Save download URL to Settings
    const downloadUrl = `/downloads/${filename}`;
    await Settings.findOneAndUpdate(
      { key: 'apk_download_url' },
      { value: downloadUrl },
      { upsert: true }
    );

    // Save incremented version to Settings
    await Settings.findOneAndUpdate(
      { key: 'pwa_version' },
      { value: newVersion },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `APK file uploaded successfully as "${filename}"! App version bumped to ${newVersion}.`,
      downloadUrl,
      version: newVersion
    });
  } catch (error) {
    console.error('[APK Upload API Error]', error);
    return NextResponse.json({ error: 'Failed to upload APK file: ' + error.message }, { status: 500 });
  }
}
