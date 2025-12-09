# DigitalOcean Functions - Form Meta Tags

## Overview

Function ini menangani social media crawlers (Facebook, Twitter, WhatsApp, dll) dengan mengembalikan HTML yang berisi meta tags dinamis berdasarkan data form dari Supabase.

## Cara Kerja

1. Request masuk ke function
2. Cek User-Agent apakah crawler atau browser biasa
3. **Jika browser biasa**: Redirect ke SPA (`/#/f/slug`)
4. **Jika crawler**: Fetch data form dari Supabase, generate HTML dengan meta tags, return HTML

## Deploy ke DigitalOcean

### Prerequisites

1. Install doctl CLI: https://docs.digitalocean.com/reference/doctl/how-to/install/
2. Authenticate: `doctl auth init`
3. Connect ke Functions namespace

### Deploy Steps

```bash
# 1. Masuk ke folder functions
cd functions

# 2. Install dependencies
cd packages/meta-tags/form-meta
npm install
cd ../../..

# 3. Deploy function
doctl serverless deploy .

# 4. Get function URL
doctl serverless functions get meta-tags/form-meta --url
```

### Set Environment Variables

Di DigitalOcean Console:
1. Go to Apps > Functions
2. Select `form-meta` function
3. Add environment variables:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `APP_URL`: https://form.cuanmax.digital

## URL Routing Setup

Setelah function deployed, Anda perlu setup routing agar request ke `/f/*` diarahkan ke function.

### Option 1: Cloudflare Workers (Recommended)

Jika menggunakan Cloudflare:

```javascript
// Cloudflare Worker
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Jika path adalah /f/*, forward ke DO Function
  if (url.pathname.startsWith('/f/')) {
    const functionUrl = 'https://faas-sgp1-XXXXX.doserverless.co/api/v1/web/fn-XXXXX/meta-tags/form-meta'
    const newUrl = new URL(functionUrl)
    newUrl.search = url.search
    
    return fetch(newUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'X-Original-Path': url.pathname,
      },
    })
  }
  
  // Otherwise, serve dari origin
  return fetch(request)
}
```

### Option 2: DigitalOcean App Platform

Tambahkan route di App Spec:

```yaml
routes:
  - path: /f
    component:
      name: form-meta-function
```

### Option 3: Nginx Reverse Proxy

```nginx
location /f/ {
    # Forward crawler requests ke function
    if ($http_user_agent ~* "(facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|LinkedInBot)") {
        proxy_pass https://faas-sgp1-XXXXX.doserverless.co/api/v1/web/fn-XXXXX/meta-tags/form-meta;
    }
    
    # Browser biasa - serve SPA
    try_files $uri $uri/ /index.html;
}
```

## Testing

### Test dengan curl (simulasi crawler)

```bash
# Simulasi Facebook crawler
curl -H "User-Agent: facebookexternalhit/1.1" \
  "https://your-function-url/f/al-quran-al-mushawir"

# Simulasi WhatsApp
curl -H "User-Agent: WhatsApp/2.0" \
  "https://your-function-url/f/al-quran-al-mushawir"
```

### Facebook Sharing Debugger

Setelah setup routing:
1. Buka https://developers.facebook.com/tools/debug/
2. Masukkan URL: `https://form.cuanmax.digital/f/al-quran-al-mushawir`
3. Klik "Debug" atau "Scrape Again"

## Troubleshooting

### Meta tags tidak muncul di Facebook
- Pastikan routing sudah benar
- Cek apakah function bisa diakses
- Gunakan Facebook Debugger untuk scrape ulang

### Function timeout
- Pastikan Supabase URL dan key benar
- Cek apakah form exists di database
- Periksa logs di DO Console
