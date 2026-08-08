import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Turns a normal Cloudinary delivery URL into one that forces a browser download
 * (adds the fl_attachment flag right after /upload/) instead of opening inline.
 */
export function toDownloadUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('fl_attachment')) return url;
  return url.replace('/upload/', '/upload/fl_attachment/');
}

export default cloudinary;
