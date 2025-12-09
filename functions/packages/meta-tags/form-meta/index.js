/**
 * DigitalOcean Function: Form Meta Tags Handler
 * 
 * Mendeteksi social media crawlers dan mengembalikan HTML dengan meta tags dinamis
 * berdasarkan data form dari Supabase.
 * 
 * Deploy: doctl serverless deploy functions
 */

const fetch = require('node-fetch');

// Supabase config - set via environment variables in DO Functions
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ggxyaautsdukyapstlgr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHlhYXV0c2R1a3lhcHN0bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODQxNDksImV4cCI6MjA4MDE2MDE0OX0.oVMzNX8x6VEoRtYrSYszZXy_08-QdxAs22xC6NdIR-4';
const APP_URL = process.env.APP_URL || 'https://form.cuanmax.digital';

// Simple fetch wrapper for Supabase REST API
async function supabaseQuery(table, filters = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filters}`;
    const response = await fetch(url, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase error: ${response.status} - ${error}`);
    }

    return response.json();
}

// User agents dari social media crawlers
const CRAWLER_USER_AGENTS = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'Discordbot',
    'Pinterest',
    'Googlebot',
    'bingbot',
];

function isCrawler(userAgent) {
    if (!userAgent) return false;
    return CRAWLER_USER_AGENTS.some(bot =>
        userAgent.toLowerCase().includes(bot.toLowerCase())
    );
}

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function generateMetaHtml(form, fullUrl) {
    const title = escapeHtml(form.title || 'Formulir Pemesanan');
    const description = escapeHtml(
        stripHtml(form.description || '').substring(0, 160) ||
        `Pesan ${form.title} sekarang dengan harga terbaik!`
    );
    const image = form.mainImage || `${APP_URL}/og-image.png`;

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(fullUrl)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:locale" content="id_ID">
  <meta property="og:site_name" content="OrderDash">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(fullUrl)}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  
  <!-- Redirect untuk browser biasa -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(fullUrl)}">
  
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .loading { text-align: center; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Memuat ${title}...</p>
  </div>
</body>
</html>`;
}

async function main(args) {
    const userAgent = args.__ow_headers?.['user-agent'] || '';
    // Support both __ow_path (dari proxy) dan path query parameter
    const path = args.__ow_path || args.path || '';
    const queryString = args.__ow_query || '';

    // DEBUG MODE: Jika ada query debug=1, return debug info
    if (args.debug === '1' || args.debug === 'true') {
        try {
            // Test query semua forms menggunakan REST API
            const allForms = await supabaseQuery('forms', 'select=id,title,slug&limit=5');

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receivedArgs: { path, userAgent: userAgent.substring(0, 50), queryString },
                    supabaseUrl: SUPABASE_URL,
                    formsQuery: { data: allForms, error: null },
                }, null, 2),
            };
        } catch (error) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receivedArgs: { path, userAgent: userAgent.substring(0, 50), queryString },
                    supabaseUrl: SUPABASE_URL,
                    formsQuery: { data: null, error: error.message },
                }, null, 2),
            };
        }
    }

    console.log('Received args:', JSON.stringify({ path, userAgent, queryString, allArgs: Object.keys(args) }));

    // Extract form identifier dari path (format: /f/form-slug atau /f/uuid)
    let formIdentifier = null;
    const formMatch = path.match(/\/f\/([^/?]+)/);
    if (formMatch) {
        formIdentifier = formMatch[1];
    } else if (path && !path.startsWith('/')) {
        // Jika path tidak dimulai dengan /, mungkin langsung slug
        formIdentifier = path.replace(/^f\//, '');
    }

    // Jika bukan request ke form, redirect ke app
    if (!formIdentifier) {
        return {
            statusCode: 302,
            headers: { Location: APP_URL },
        };
    }

    // Jika bukan crawler, redirect ke SPA
    if (!isCrawler(userAgent)) {
        const redirectUrl = `${APP_URL}/#/f/${formIdentifier}${queryString ? '?' + queryString : ''}`;
        return {
            statusCode: 302,
            headers: { Location: redirectUrl },
        };
    }

    // Crawler detected - fetch form data dan return meta tags
    try {
        // Normalize identifier - lowercase
        const normalizedIdentifier = formIdentifier.toLowerCase();

        // Check if it's a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formIdentifier);

        // Build query params untuk REST API
        // Gunakan or filter: slug.eq, slug.ilike, atau id.eq (jika UUID)
        let queryParams = 'select=id,title,description,mainImage,slug';
        if (isUuid) {
            queryParams += `&or=(slug.eq.${normalizedIdentifier},slug.ilike.${normalizedIdentifier},id.eq.${formIdentifier})`;
        } else {
            queryParams += `&or=(slug.eq.${normalizedIdentifier},slug.ilike.${normalizedIdentifier})`;
        }
        queryParams += '&limit=1';

        console.log('Searching form with query:', queryParams);

        const forms = await supabaseQuery('forms', queryParams);
        const form = forms && forms.length > 0 ? forms[0] : null;

        console.log('Form found:', form ? form.title : 'null');

        if (!form) {
            // Form not found - return default meta
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
                body: generateMetaHtml(
                    { title: 'Formulir Tidak Ditemukan', description: 'Formulir yang Anda cari tidak tersedia.' },
                    `${APP_URL}/#/f/${formIdentifier}`
                ),
            };
        }

        const fullUrl = `${APP_URL}/#/f/${form.slug || form.id}${queryString ? '?' + queryString : ''}`;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600', // Cache 1 hour
            },
            body: generateMetaHtml(form, fullUrl),
        };

    } catch (error) {
        console.error('Error fetching form:', error);

        // Return default meta on error
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: generateMetaHtml(
                { title: 'OrderDash - Formulir Pemesanan', description: 'Platform pemesanan online terpercaya.' },
                `${APP_URL}/#/f/${formIdentifier}`
            ),
        };
    }
}

exports.main = main;
