# MongoDB + Vercel Setup Guide

This project now supports the environment variables you listed:

- `MONGODB_URI`
- `PORT`
- `IMAGE_STORAGE_PROVIDER`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_URL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

## 1. Install dependencies

```bash
npm install
```

## 2. Create your local environment file

Copy `.env.example` to `.env` and fill in real values.

## 3. Generate `ADMIN_PASSWORD_HASH`

Run:

```bash
npm run auth:hash-password
```

Paste the generated bcrypt hash into `ADMIN_PASSWORD_HASH`.

## 4. Example `.env`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio?retryWrites=true&w=majority
PORT=3003
IMAGE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_URL=
ADMIN_PASSWORD_HASH=$2b$12$replace-this-with-bcrypt-hash
ADMIN_JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-project.vercel.app
VITE_API_URL=http://localhost:3003/api
```

Notes:

- `PORT` is used by the local API server
- `IMAGE_STORAGE_PROVIDER=cloudinary` uploads images to Cloudinary
- `IMAGE_STORAGE_PROVIDER=inline` keeps the current inline fallback behavior
- `CLOUDINARY_URL` is optional if you provide the three Cloudinary fields separately
- `VITE_API_URL` is for local development only

## 5. Run locally

Start the API:

```bash
npm run dev:api
```

Start the frontend in a second terminal:

```bash
npm run dev
```

## 6. Vercel setup

In Vercel, add:

- `MONGODB_URI`
- `IMAGE_STORAGE_PROVIDER`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_URL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

You usually do not need `PORT` or `VITE_API_URL` in Vercel production.

## 7. What changed in the backend

- Admin auth now checks `ADMIN_PASSWORD_HASH`
- Admin sessions now use JWT signed with `ADMIN_JWT_SECRET`
- CORS now respects `CORS_ALLOWED_ORIGINS`
- Image uploads now honor `IMAGE_STORAGE_PROVIDER`
- Cloudinary credentials are supported directly
