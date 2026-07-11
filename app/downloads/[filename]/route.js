import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { filename } = params;

    // Parse query params to support mirror downloads
    const url = new URL(request.url);
    const isMirror = url.searchParams.get('mirror') === 'true';

    // Security: Only allow downloading files ending with .apk to prevent directory traversal
    if (!filename.endsWith('.apk')) {
      return new Response('Access denied. Only APK files can be downloaded from this route.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Verify the downloads folder exists
    const downloadDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Perform case-insensitive check for the file
    const files = fs.readdirSync(downloadDir);
    const matchedFile = files.find(f => f.toLowerCase() === filename.toLowerCase());

    if (!matchedFile) {
      return new Response(`Error: The requested file "${filename}" was not found on the server. Please compile the APK and upload it to downloads/${filename}`, {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const filePath = path.join(downloadDir, matchedFile);

    // Read the file and serve it with proper binary headers
    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    const contentType = isMirror ? 'application/octet-stream' : 'application/vnd.android.package-archive';

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving APK:', error);
    return new Response('Internal Server Error while downloading APK.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
