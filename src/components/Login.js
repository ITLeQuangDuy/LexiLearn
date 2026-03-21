import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Loader } from 'lucide-react';
import { login } from '../auth';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    const result = await login(username, password);
    setLoading(false);
    if (result.ok) {
      onLogin(result.username);
    } else {
      setError(result.error);
      setPassword('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
    }}>
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,107,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h1 style={{
            fontWeight: 800, fontSize: 32, letterSpacing: -1,
            background: 'linear-gradient(90deg, var(--accent3), var(--cyan))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>LexiLearn</h1>
          <p style={{ color: 'var(--text3)', marginTop: 6, fontSize: 14 }}>Đăng nhập để học từ vựng</p>
        </div>

        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 36,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,107,255,0.1)',
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Tên đăng nhập</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Nhập username..."
              autoComplete="username"
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                type={showPass ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }}
                disabled={loading}
              />
              <button onClick={() => setShowPass(p => !p)} disabled={loading}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ color: 'var(--red)', fontSize: 14 }}>⚠️ {error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !username.trim() || !password}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 20px', borderRadius: 10, border: 'none',
              cursor: loading || !username.trim() || !password ? 'not-allowed' : 'pointer',
              background: loading || !username.trim() || !password
                ? 'var(--bg3)'
                : 'linear-gradient(135deg, var(--accent), #5b4fd4)',
              color: loading || !username.trim() || !password ? 'var(--text3)' : '#fff',
              fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)',
              transition: 'all 0.2s',
              boxShadow: loading || !username.trim() || !password ? 'none' : '0 4px 20px rgba(124,107,255,0.35)',
            }}>
            {loading
              ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : <LogIn size={18} />}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 20 }}>
          Tài khoản được quản lý bởi admin qua file .env
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', color: 'var(--text2)', fontSize: 13,
  fontWeight: 600, marginBottom: 8, letterSpacing: 0.3,
};
const inputStyle = {
  width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
  borderRadius: 9, color: 'var(--text)', padding: '11px 14px', fontSize: 15,
  outline: 'none', fontFamily: 'var(--font-display)', transition: 'border-color 0.2s',
};
