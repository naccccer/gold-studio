# Proxy And Bandwidth Notes

This repo is often used from Iran, where some external services may be blocked and proxy bandwidth can be expensive.

## Default
- Prefer local/offline workflows first.
- Do not use proxy for local file edits, local MySQL, normal TypeScript checks, or app pages that do not call Liara.
- Try external commands directly first when they normally work.
- Enable proxy only for blocked external access, then clear it when finished.

Use proxy when needed for:
- npm package downloads.
- Prisma engine downloads from `binaries.prisma.sh`.
- Gemini or other blocked AI calls.
- S3-compatible storage only if the storage endpoint is blocked directly.

Liara image generation should use direct Iran IP access. If v2rayN/TUN is enabled, add a direct/bypass rule for:

```text
ai.liara.ir
.liara.ir
185.208.181.174
```

Check local Node access:

```powershell
npm run check:liara
```

## v2rayN PowerShell Setup
If v2rayN listens on `127.0.0.1:10808`, proxy env vars must include a scheme.

HTTP proxy:

```powershell
$env:http_proxy = "http://127.0.0.1:10808"
$env:HTTP_PROXY = "http://127.0.0.1:10808"
$env:https_proxy = "http://127.0.0.1:10808"
$env:HTTPS_PROXY = "http://127.0.0.1:10808"
```

SOCKS5 proxy:

```powershell
$env:http_proxy = "socks5://127.0.0.1:10808"
$env:HTTP_PROXY = "socks5://127.0.0.1:10808"
$env:https_proxy = "socks5://127.0.0.1:10808"
$env:HTTPS_PROXY = "socks5://127.0.0.1:10808"
```

Bare values like `127.0.0.1:10808` are invalid for Prisma and many Node tools.

## Check And Test
Check current proxy env vars:

```powershell
Get-ChildItem Env:*proxy*
```

Test direct access to Prisma binaries:

```powershell
Invoke-WebRequest "https://binaries.prisma.sh/" -Method Head -TimeoutSec 10
```

Test through v2rayN without changing env vars:

```powershell
Invoke-WebRequest "https://binaries.prisma.sh/" -Method Head -TimeoutSec 10 -Proxy "http://127.0.0.1:10808"
```

If v2rayN is SOCKS5-only, PowerShell's `Invoke-WebRequest -Proxy` may not be enough. Set SOCKS5 env vars and test with `npm run db:generate`.

## Clear Proxy
```powershell
Remove-Item Env:http_proxy, Env:HTTP_PROXY, Env:https_proxy, Env:HTTPS_PROXY -ErrorAction SilentlyContinue
```

Only keep proxy enabled for `npm run dev` when testing Liara generation and direct access fails.
