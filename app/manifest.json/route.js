import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Settings } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const settingsList = await Settings.find({ 
      key: { $in: [
        'pwa_name', 
        'pwa_short_name', 
        'pwa_theme_color', 
        'pwa_background_color', 
        'pwa_icon', 
        'pwa_splash_screen',
        'pwa_version'
      ] } 
    });

    const settingsMap = {};
    settingsList.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    const name = settingsMap['pwa_name'] || 'FastPay';
    const short_name = settingsMap['pwa_short_name'] || 'FastPay';
    const theme_color = settingsMap['pwa_theme_color'] || '#000000';
    const background_color = settingsMap['pwa_background_color'] || '#000000';
    const icon = settingsMap['pwa_icon'] || '/icon-192.png';
    const splash_screen = settingsMap['pwa_splash_screen'] || '/icon-512.png';

    const manifestData = {
      name,
      short_name,
      description: `${name} Secure Yield Platform`,
      start_url: '/',
      display: 'standalone',
      background_color,
      theme_color,
      orientation: 'portrait-primary',
      icons: [
        {
          src: icon,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: splash_screen,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    return new NextResponse(JSON.stringify(manifestData), {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate dynamic manifest:', error);
    // Return fallback static manifest in case of DB error
    const fallback = {
      name: "FastPay",
      short_name: "FastPay",
      description: "FastPay Secure Yield Platform",
      start_url: "/",
      display: "standalone",
      background_color: "#000000",
      theme_color: "#000000",
      orientation: "portrait-primary",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };
    return new NextResponse(JSON.stringify(fallback), {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    });
  }
}
