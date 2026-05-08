const DEFAULT_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;

const parseDataUrl = (dataUrl) => {
  if (typeof dataUrl !== 'string') {
    throw new Error('Image payload must be a string');
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data format');
  }

  const mimeType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  if (!DEFAULT_ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('Image is too large. Max supported size is 8MB');
  }

  return { mimeType, buffer, base64: match[2] };
};

const sanitizeSegment = (value, fallback = 'asset') => {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || fallback;
};

const extensionFromMime = (mimeType) => {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  return map[mimeType] || 'jpg';
};

const makeStorageKey = ({ folder, assetType, fileName, mimeType }) => {
  const safeFolder = sanitizeSegment(folder, 'portfolio');
  const safeType = sanitizeSegment(assetType, 'general');
  const originalBase = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'upload';
  const safeName = sanitizeSegment(originalBase, 'upload');
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${safeFolder}/${safeType}/${safeName}-${timestamp}-${random}.${extensionFromMime(mimeType)}`;
};

const uploadToCloudinary = async ({ dataUrl, folder, assetType, fileName }) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }

  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const safeFolder = `${sanitizeSegment(folder, 'portfolio')}/${sanitizeSegment(assetType, 'general')}`;
  const publicIdBase = fileName ? sanitizeSegment(fileName.replace(/\.[^/.]+$/, ''), 'upload') : 'upload';

  const uploaded = await cloudinary.uploader.upload(dataUrl, {
    folder: safeFolder,
    public_id: `${publicIdBase}-${Date.now()}`,
    resource_type: 'image',
    overwrite: false,
  });

  return {
    provider: 'cloudinary',
    url: uploaded.secure_url || uploaded.url,
    key: uploaded.public_id,
    bytes: uploaded.bytes || 0,
    width: uploaded.width || null,
    height: uploaded.height || null,
  };
};

const uploadToS3 = async ({ dataUrl, folder, assetType, fileName }) => {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error('S3 is not configured. Set S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.');
  }

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { buffer, mimeType } = parseDataUrl(dataUrl);
  const key = makeStorageKey({ folder, assetType, fileName, mimeType });

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const base = publicBaseUrl?.trim()
    ? publicBaseUrl.replace(/\/$/, '')
    : `https://${bucket}.s3.${region}.amazonaws.com`;

  return {
    provider: 's3',
    url: `${base}/${key}`,
    key,
    bytes: buffer.length,
    width: null,
    height: null,
  };
};

export const getConfiguredImageProvider = () => {
  const raw = (process.env.IMAGE_STORAGE_PROVIDER || 'cloudinary').toLowerCase().trim();
  if (raw === 's3') return 's3';
  return 'cloudinary';
};

export const uploadImageFromDataUrl = async ({
  dataUrl,
  folder = 'portfolio',
  assetType = 'general',
  fileName = '',
}) => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Missing image data');
  }

  parseDataUrl(dataUrl);

  const provider = getConfiguredImageProvider();

  if (provider === 's3') {
    return uploadToS3({ dataUrl, folder, assetType, fileName });
  }

  return uploadToCloudinary({ dataUrl, folder, assetType, fileName });
};
