# Proxy Notes

Use direct access first. Do not enable proxy for local file edits, local MySQL, TypeScript checks, or normal app pages that do not call external services.

Use proxy only when direct access fails for:

- npm package downloads
- Prisma downloads
- GitHub access
- S3-compatible storage only if the storage endpoint is blocked

Do not leave proxy enabled for PM2 app or worker processes. Ovala uses Iran-accessible providers such as Liara, Avalai, and FarazSMS so production and staging generation should normally run direct.

## Liara

Liara image generation should usually use direct Iran IP access. If v2rayN/TUN is enabled, add direct/bypass rules for:

```text
ai.liara.ir
.liara.ir
185.208.181.174
```

Check local Liara access:

```powershell
npm run check:liara
```

## v2rayN PowerShell Env

Proxy env vars must include a scheme. Bare values like `127.0.0.1:10808` are invalid for many Node/Prisma tools.

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

Check current proxy variables:

```powershell
Get-ChildItem Env:*proxy*
```

Clear proxy variables:

```powershell
Remove-Item Env:http_proxy, Env:HTTP_PROXY, Env:https_proxy, Env:HTTPS_PROXY -ErrorAction SilentlyContinue
```

Only keep proxy enabled for a single command that needs it, such as GitHub pull or manual Certbot access. Clear it before starting or restarting PM2 app and worker processes.
