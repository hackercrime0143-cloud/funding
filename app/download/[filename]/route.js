import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { filename } = params;

    // Security: Only allow downloading files ending with .apk to prevent directory traversal
    if (!filename.endsWith('.apk')) {
      return new Response('Access denied. Only APK files can be downloaded from this route.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Path to the public/download folder
    const filePath = path.join(process.cwd(), 'public', 'download', filename);

    // Verify the file exists on the server
    if (!fs.existsSync(filePath)) {
      return new Response(`Error: The requested file "${filename}" was not found on the server. Please compile the APK and upload it to public/download/${filename}`, {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Read the file and serve it with proper binary headers
    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
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
