# Live Test Notes

## VPS or Normal Node Server
No major code change is needed for a live test if the server has:
- Node.js 20+
- MySQL reachable from the app
- writable project filesystem for `public/uploads`
- outbound access to GapGPT

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
GAPGPT_API_KEY="GAPGPT_API_KEY"
GAPGPT_BASE_URL="https://api.gapgpt.app/v1"
GAPGPT_IMAGE_MODEL="gemini-3.1-flash-image-preview"
GAPGPT_IMAGE_SIZE="1024x1024"
ADMIN_EMAIL="admin@example.com"
```

## Serverless Hosting
Do not use the current upload implementation unchanged on serverless hosting.

Current code writes uploaded and generated images to `public/uploads`. Serverless filesystems are often read-only or temporary, so images can disappear.

Before serverless live testing, move image storage to a persistent service such as S3, Cloudflare R2, or another object storage provider.

## Proxy
Local v2rayN proxy settings do not automatically apply to a live server. The live server itself must have outbound access to GapGPT.
