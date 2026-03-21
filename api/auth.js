// api/auth.js — Vercel Serverless Function
// Đọc users từ process.env, verify password, trả JWT (tự ký bằng Web Crypto API)

export const config = { runtime: 'edge' };

// ── Minimal JWT implementation using Web Crypto (no npm deps) ──────────────
async function makeJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsigned = `${enc(header)}.${enc(payload)}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned));
  const b64sig = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${unsigned}.${b64sig}`;
}

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

// ── Read users from env ─────────────────────────────────────────────────────
function getUsers() {
  const users = [];
  let i = 1;
  while (true) {
    const username = process.env[`USER_${i}_USERNAME`];
    const password = process.env[`USER_${i}_PASSWORD`];
    const displayName = process.env[`USER_${i}_DISPLAY_NAME`] || username;
    if (!username || !password) break;
    users.push({ username, password, displayName });
    i++;
  }
  return users;
}

// ── Main handler ────────────────────────────────────────────────────────────
export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-me';

  // POST /api/auth?action=login
  if (req.method === 'POST' && url.searchParams.get('action') === 'login') {
    try {
      const { username, password } = await req.json();
      const users = getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Sai tên đăng nhập hoặc mật khẩu' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const token = await makeJwt({
        sub: user.username,
        name: user.displayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      }, secret);
      return new Response(JSON.stringify({ token, displayName: user.displayName, username: user.username }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Lỗi server: ' + e.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // GET /api/auth?action=verify — verify token
  if (req.method === 'GET' && url.searchParams.get('action') === 'verify') {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    const payload = await verifyJwt(token, secret);
    if (!payload) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ valid: true, username: payload.sub, displayName: payload.name }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export { verifyJwt };
