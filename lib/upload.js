import fs from 'fs';
import path from 'path';

/**
 * Decodes a base64 image and saves it to the local disk in public/subFolder.
 * Returns the public relative path of the file (e.g. /uploads/filename.png).
 * If the input is not a base64 string (e.g. already a path or url), it returns it as-is.
 */
export async function saveBase64Image(base64Data, subFolder = 'uploads') {
  if (!base64Data) return null;

  // If it's already a public path or URL, just return it
  if (!base64Data.startsWith('data:image')) {
    return base64Data;
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string format');
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Determine file extension
    let extension = 'png';
    const mimeType = matches[1];
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      extension = 'jpg';
    } else if (mimeType.includes('gif')) {
      extension = 'gif';
    } else if (mimeType.includes('webp')) {
      extension = 'webp';
    }

    const fileName = `screenshot-${Date.now()}-${Math.floor(Math.random() * 100000)}.${extension}`;
    
    // Upload folder inside Next.js public directory
    const uploadDir = path.join(process.cwd(), 'public', subFolder);
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);

    return `/api/uploads/${fileName}`;
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw new Error('Failed to save uploaded image: ' + error.message);
  }
}
