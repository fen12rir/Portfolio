# Image URL Storage Setup (Cloudinary or S3)

This project now supports full image URL storage.

When you upload an image in Admin:
1. Image is compressed in browser.
2. Image is uploaded to your storage provider.
3. Only the returned image URL is saved in MongoDB.

## 1) Choose provider

Set `IMAGE_STORAGE_PROVIDER`:
- `cloudinary` (recommended)
- `s3`

## 2) Local `.env` (server/.env)

Keep your existing MongoDB values and add one provider block.

Also add admin security variables:
```env
ADMIN_PASSWORD_HASH=your_bcrypt_hash
ADMIN_JWT_SECRET=your_long_random_secret
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Generate `ADMIN_PASSWORD_HASH` with:
```bash
npm run auth:hash-password -- "your-strong-password"
```

### Cloudinary
```env
IMAGE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### S3
```env
IMAGE_STORAGE_PROVIDER=s3
S3_BUCKET_NAME=your_bucket
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_PUBLIC_BASE_URL=https://your-cdn-or-bucket-url
```

`S3_PUBLIC_BASE_URL` is optional.  
If omitted, URLs default to `https://<bucket>.s3.<region>.amazonaws.com/<key>`.

## 3) Vercel environment variables

Add the same variables in Vercel Project Settings -> Environment Variables.

At minimum:
- `MONGODB_URI`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_JWT_SECRET`
- `IMAGE_STORAGE_PROVIDER`
- Provider-specific keys above

## 4) Install dependencies

```bash
npm install
```

## 5) Run locally

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm run dev
```

## 6) Verify

Upload avatar/project/gallery image in Admin:
- Save should be fast.
- Stored field in MongoDB should be a normal `https://...` URL, not a `data:image/...` string.

## Notes

- Existing previously saved base64 images remain until re-uploaded.
- If upload fails, Admin will show the provider error message.
