# Proxy and Bandwidth Notes

This repo is often used from Iran, where some external services may be blocked and proxy bandwidth can be expensive.

## Prefer Offline By Default
- Prefer offline/local workflows first for all development tasks.
- Run checks, lint, build, Prisma against local DB, and UI work without internet/proxy whenever possible.
- Only enable internet/proxy for tasks that strictly require external access (package install, Prisma engine download, model API calls, remote fetches).
- After network-required commands finish, clear proxy env vars and return to offline/local mode.

## Use Proxy Only When Needed
- Try external commands without proxy first when they normally work for you.
- Use proxy for `npm install` only when npm registry access fails.
- Use proxy for `npx prisma generate` when Prisma needs to download engines from `binaries.prisma.sh`.
- Use proxy while running image generation only if Liara is unreachable directly.
- Use proxy for S3-compatible storage only if your object storage endpoint is blocked directly.
- Do not use proxy for local MySQL, local file edits, normal TypeScript checks, or local app pages that do not call Liara.

## v2rayN PowerShell Setup
If v2rayN listens on `127.0.0.1:10808`, the proxy env var must include a scheme.

For HTTP proxy mode:
```powershell
$env:http_proxy = "http://127.0.0.1:10808"
$env:HTTP_PROXY = "http://127.0.0.1:10808"
$env:https_proxy = "http://127.0.0.1:10808"
$env:HTTPS_PROXY = "http://127.0.0.1:10808"
```

For SOCKS5 mode:
```powershell
$env:http_proxy = "socks5://127.0.0.1:10808"
$env:HTTP_PROXY = "socks5://127.0.0.1:10808"
$env:https_proxy = "socks5://127.0.0.1:10808"
$env:HTTPS_PROXY = "socks5://127.0.0.1:10808"
```

Bare values like `127.0.0.1:10808` are invalid for Prisma and many Node tools.

## Check Current Status
See whether proxy env vars are currently set:
```powershell
Get-ChildItem Env:*proxy*
```

Test direct access to Prisma binaries:
```powershell
Invoke-WebRequest "https://binaries.prisma.sh/" -Method Head -TimeoutSec 10
```

Test access through v2rayN without changing env vars:
```powershell
Invoke-WebRequest "https://binaries.prisma.sh/" -Method Head -TimeoutSec 10 -Proxy "http://127.0.0.1:10808"
```

If v2rayN is configured as SOCKS5 only, PowerShell's `Invoke-WebRequest -Proxy` may not be enough. In that case, use the SOCKS5 env vars below and test with `npx prisma generate`.

## Clear Proxy After External Commands
```powershell
Remove-Item Env:http_proxy, Env:HTTP_PROXY, Env:https_proxy, Env:HTTPS_PROXY -ErrorAction SilentlyContinue
```

## Common Commands
```powershell
$env:DATABASE_URL = "mysql://gold_studio_user:YOUR_PASSWORD@127.0.0.1:3306/gold_studio"
npx prisma generate
```

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:10808"
npm run dev
```

Only keep proxy enabled for `npm run dev` when testing Liara generation and direct access fails.

## Local-First Font Strategy (No External Dependency)
- Keep UI fonts self-hosted in `public/fonts` and loaded through `next/font/local` in `src/app/layout.tsx`.
- The default UI/body font files currently live directly in `public/fonts`:
  - `Vazir-Regular-FD.woff2`
  - `Vazir-Medium-FD.woff2`
  - `Vazir-Bold-FD.woff2`
- Doran display files also live directly in `public/fonts`:
  - `Doran-Regular.woff2`
  - `Doran-Bold.woff2`
- Expose app typography through Tailwind theme tokens in `src/app/globals.css`: `font-sans` for UI/body and `font-display` for short editorial titles.
- Do not rely on `next/font/google` for core UI typography in restricted-network environments.
- If local files are missing, UI will fall back to system fonts until files are added.
