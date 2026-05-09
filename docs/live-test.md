# Live Test Notes

## VPS or Normal Node Server
No major code change is needed for a live test if the server has:
- Node.js 20+
- MySQL reachable from the app
- writable project filesystem for `public/uploads` when using local storage
- outbound access to Liara

Run on the server:
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Required production env vars:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/gold_studio"
AUTH_SECRET="LONG_RANDOM_SECRET"
LIARA_API_KEY="LIARA_API_KEY"
LIARA_BASE_URL="https://ai.liara.ir/api/69fe30c50bb427e049d327f6/v1"
LIARA_IMAGE_MODEL="google/gemini-2.5-flash-image"
LIARA_IMAGE_SIZE="2048x2048"
LIARA_IMAGE_QUALITY="2K"
LIARA_FALLBACK_LONG_EDGE="2048"
ADMIN_EMAIL="admin@example.com"
STORAGE_DRIVER="local"
```

Optional later S3-compatible object storage:
```env
STORAGE_DRIVER="s3"
S3_ENDPOINT="https://hot.ir-central1.arvanstorage.ir"
S3_REGION="ir-central1"
S3_BUCKET="gold-studio"
S3_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
S3_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
S3_PUBLIC_BASE_URL="https://gold-studio.hot.ir-central1.arvanstorage.ir"
S3_FORCE_PATH_STYLE="true"
```

Notes:
- Existing local `fileUrl` values such as `/uploads/source/...` remain valid.
- For the current live test, keep `STORAGE_DRIVER="local"` and make sure `public/uploads` is writable by the app process.
- New uploads and generated results use the configured storage driver.
- If S3 is enabled later, the app can serve S3-backed uploads through `/api/storage/[...key]` so the bucket does not need public-read access for in-app image display.

## Serverless Hosting
Do not use the current upload implementation unchanged on serverless hosting.

Current code can write uploaded and generated images to either `public/uploads` or an S3-compatible bucket. Serverless filesystems are often read-only or temporary, so use S3-compatible storage there.

Before serverless live testing, move image storage to a persistent service such as S3, Cloudflare R2, or another object storage provider.

## Proxy
Local v2rayN proxy settings do not automatically apply to a live server. The live server itself must have outbound access to Liara.
