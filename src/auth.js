// Auth utility - credentials stored in Vercel environment variables
// Format in .env:
//   REACT_APP_ACCOUNTS=username1:hashedPassword1,username2:hashedPassword2
//
// Generate a hash for a password by running in browser console:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
//     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))

const SESSION_KEY = 'll_session';

export async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Parse accounts from env: "user1:hash1,user2:hash2"
function getAccounts() {
  const raw = process.env.REACT_APP_ACCOUNTS || '';
  const accounts = {};
  raw.split(',').forEach(entry => {
    const colonIdx = entry.indexOf(':');
    if (colonIdx > 0) {
      const username = entry.slice(0, colonIdx).trim().toLowerCase();
      const hash = entry.slice(colonIdx + 1).trim();
      if (username && hash) accounts[username] = hash;
    }
  });
  return accounts;
}

export async function login(username, password) {
  const accounts = getAccounts();
  const user = username.trim().toLowerCase();
  if (!accounts[user]) return { ok: false, error: 'Tên đăng nhập không tồn tại.' };
  const hash = await sha256(password);
  if (hash !== accounts[user]) return { ok: false, error: 'Mật khẩu không đúng.' };
  // Store session in sessionStorage (cleared when tab closes) + localStorage for persistence
  const session = { username: user, loginAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, username: user };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Session expires after 30 days
    if (Date.now() - session.loginAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
