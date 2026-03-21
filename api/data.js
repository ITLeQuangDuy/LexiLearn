// api/data.js — Vercel Serverless Edge Function
// Lưu/đọc dữ liệu từ Vercel KV (Redis), xác thực JWT mỗi request

export const config = { runtime: 'edge' };

// ── Minimal JWT verify (copy từ auth.js vì edge functions isolated) ─────────
async function verifyJwt(token, secret) {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const unsigned = `${h}.${p}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBytes = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(unsigned));
    if (!valid) return null;
    const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch { return null; }
}

// ── Vercel KV REST API wrapper ──────────────────────────────────────────────
async function kvGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

async function kvSet(key, value) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  return res.ok;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ── Main handler ────────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  // Auth check
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-me';
  const payload = await verifyJwt(token, secret);
  if (!payload) return json({ error: 'Unauthorized' }, 401);

  const username = payload.sub;
  const url = new URL(req.url);
  const type = url.searchParams.get('type'); // 'vocab' | 'sentences' | 'settings'

  if (!type || !['vocab', 'sentences', 'settings'].includes(type)) {
    return json({ error: 'Invalid type. Use: vocab | sentences | settings' }, 400);
  }

  const kvKey = `user:${username}:${type}`;

  // GET — đọc dữ liệu
  if (req.method === 'GET') {
    const raw = await kvGet(kvKey);
    if (raw === null) {
      // Trả về default rỗng
      const defaults = { vocab: [], sentences: [], settings: {} };
      return json({ data: defaults[type] });
    }
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return json({ data });
    } catch {
      return json({ data: [] });
    }
  }

  // POST — ghi dữ liệu
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { data } = body;
      if (data === undefined) return json({ error: 'Missing data field' }, 400);
      const ok = await kvSet(kvKey, JSON.stringify(data));
      if (!ok) return json({ error: 'KV write failed' }, 500);
      return json({ success: true });
    } catch (e) {
      return json({ error: 'Bad request: ' + e.message }, 400);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}
