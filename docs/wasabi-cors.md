# Wasabi / S3 CORS for client uploads

When uploading client assets (Brief & Creatives), the browser sends a **PUT** request directly to Wasabi. The bucket must allow this with CORS.

## 1. Open Wasabi console

Bucket → **Configuration** → **CORS**.

## 2. Add a CORS rule

Example (replace with your app origin):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["https://backoffice.digener8.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

For local dev, add `http://localhost:3000` to `AllowedOrigins`, or use `["*"]` only if you understand the security impact.

## 3. Save

After saving, try the client file upload again.

## Env vars

Ensure these are set on your server (e.g. Render):

- `WASABI_ACCESS_KEY_ID`
- `WASABI_SECRET_ACCESS_KEY`
- `WASABI_REGION`
- `WASABI_ENDPOINT`
- `WASABI_BUCKET`

If any are missing, you’ll see **Storage not configured** when uploading.
