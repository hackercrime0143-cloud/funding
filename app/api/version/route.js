import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Settings } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const settingsList = await Settings.find({
      key: { $in: ['pwa_version', 'pwa_update_notes', 'pwa_force_update', 'apk_download_url'] }
    });

    const settingsMap = {};
    settingsList.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    const latestVersion = settingsMap['pwa_version'] || '1.0.0';
    const releaseNotes = settingsMap['pwa_update_notes'] || '';
    const forceUpdate = settingsMap['pwa_force_update'] === 'true' || settingsMap['pwa_force_update'] === '1';
    const updateUrl = settingsMap['apk_download_url'] || '/downloads/FastPay.apk';

    return NextResponse.json({
      success: true,
      latestVersion,
      releaseNotes,
      forceUpdate,
      updateUrl,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Fetch version error:', error);
    return NextResponse.json({
      success: false,
      latestVersion: '1.0.0',
      releaseNotes: '',
      forceUpdate: false,
      updateUrl: '/downloads/FastPay.apk'
    }, { status: 500 });
  }
}
