/**
 * Uploads a browser File directly to Cloudinary using a short-lived signature.
 * Files never pass through Next.js, so this works on Vercel for large videos.
 */
const LARGE_FILE_BYTES = 100 * 1024 * 1024;
const CHUNK_SIZE = 20 * 1024 * 1024;

function resourceTypeFor(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'raw';
  return 'image';
}

function uploadRequest(url, formData, onProgress, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', url);
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded, event.total);
    };
    request.onerror = () => reject(new Error('Network error while uploading to Cloudinary.'));
    request.onload = () => {
      let body = {};
      try { body = JSON.parse(request.responseText); } catch { /* handled below */ }
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(body?.error?.message || 'Cloudinary rejected the upload.'));
        return;
      }
      resolve(body);
    };
    request.send(formData);
  });
}

async function getSignature(folder, resourceType, fileSize) {
  const response = await fetch('/api/cloudinary/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, resourceType, fileSize }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to prepare upload.');
  return data;
}

function resultFor(result) {
  return {
    url: result.secure_url,
    secure_url: result.secure_url,
    publicId: result.public_id,
    public_id: result.public_id,
    resourceType: result.resource_type,
    resource_type: result.resource_type,
    duration: result.duration,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    format: result.format,
  };
}

/**
 * @param {File} file
 * @param {{folder: string, onProgress?: (percent: number) => void}} options
 */
export async function uploadToCloudinary(file, { folder, onProgress } = {}) {
  if (!(file instanceof File)) throw new Error('Choose a file to upload.');
  if (!folder) throw new Error('An upload folder is required.');

  const resourceType = resourceTypeFor(file);
  const signature = await getSignature(folder, resourceType, file.size);
  const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`;
  const fields = {
    api_key: signature.apiKey,
    timestamp: String(signature.timestamp),
    signature: signature.signature,
    folder: signature.folder,
  };

  if (file.size <= LARGE_FILE_BYTES) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    formData.append('file', file);
    const result = await uploadRequest(url, formData, (loaded, total) => {
      onProgress?.(Math.round((loaded / total) * 100));
    });
    return resultFor(result);
  }

  // Cloudinary's chunked Upload API avoids the 100 MB single-request limit.
  const uploadId = crypto.randomUUID();
  let result;
  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    formData.append('file', file.slice(start, end), file.name);
    result = await uploadRequest(
      url,
      formData,
      (loaded) => onProgress?.(Math.round(((start + loaded) / file.size) * 100)),
      {
        'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
        'X-Unique-Upload-Id': uploadId,
      }
    );
  }
  return resultFor(result);
}
