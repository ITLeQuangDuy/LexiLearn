import React, { useState, useEffect } from 'react';
import './index.css';
import { getSession, logout } from './auth';
import { useVocab, useSentences } from './hooks/useFirestore';
import { useLocalStorage } from './hooks/useLocalStorage';
import Login from './components/Login';
import VocabManager from './components/VocabManager';
import VocabQuiz from './components/VocabQuiz';
import SentenceManager from './components/SentenceManager';
import SentencePractice from './components/SentencePractice';
import Settings from './components/Settings';
import {
  BookOpen, Zap, MessageSquare, PenTool,
  Settings as SettingsIcon, LogOut, Wifi, WifiOff, Loader
} from 'lucide-react';

const TABS = [
  { id: 'vocab',     label: 'Từ Vựng',   icon: BookOpen,      color: 'var(--accent)' },
  { id: 'quiz',      label: 'Luyện Từ',  icon: Zap,           color: 'var(--accent3)' },
  { id: 'sentences', label: 'Câu',       icon: MessageSquare, color: 'var(--cyan)' },
  { id: 'practice',  label: 'Luyện Câu', icon: PenTool,       color: 'var(--cyan)' },
  { id: 'settings',  label: 'Cài Đặt',   icon: SettingsIcon,  color: 'var(--text3)' },
];

function AppInner({ username, onLogout }) {
  const [tab, setTab] = useState('vocab');
  const [apiKey, setApiKey] = useLocalStorage('ll_apikey', '');

  const { items: vocab,     loading: vLoad, error: vErr, saveItem: saveVocab,     removeItem: removeVocab }     = useVocab(username);
  const { items: sentences, loading: sLoad, error: sErr, saveItem: saveSentence,  removeItem: removeSentence }  = useSentences(username);

  const loading = vLoad || sLoad;
  const error   = vErr  || sErr;
  const activeTab = TABS.find(t => t.id === tab);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '0 16px', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 6 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span className="logo-text" style={{
              fontWeight: 800, fontSize: 17, letterSpacing: -0.5,
              background: 'linear-gradient(90deg, var(--accent3), var(--cyan))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>LexiLearn</span>
          </div>

          {/* Tabs — desktop */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto', marginLeft: 8 }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px',
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: isActive ? '1px solid var(--border2)' : '1px solid transparent',
                  borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s',
                  color: isActive ? t.color : 'var(--text3)',
                  fontWeight: isActive ? 700 : 500, fontSize: 13,
                  fontFamily: 'var(--font-display)', whiteSpace: 'nowrap',
                }}>
                  <Icon size={14} />
                  <span className="tab-label">{t.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: sync + user + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            {loading  && <Loader  size={14} style={{ color: 'var(--text3)', animation: 'spin 1s linear infinite' }} />}
            {!loading && error && <WifiOff size={14} style={{ color: 'var(--yellow)' }} title="Lỗi kết nối Firebase" />}
            {!loading && !error && <Wifi  size={14} style={{ color: 'var(--green)' }} title="Đã kết nối Firebase" />}

            <span className="username-badge" style={{
              fontSize: 12, color: 'var(--text2)', fontWeight: 600,
              padding: '4px 10px', background: 'var(--bg3)',
              borderRadius: 7, border: '1px solid var(--border)',
            }}>👤 {username}</span>

            <button onClick={onLogout} title="Đăng xuất" style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 7,
              color: 'var(--text3)', cursor: 'pointer', padding: '5px 7px', display: 'flex',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-around', padding: '6px 0 8px',
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px',
              color: isActive ? t.color : 'var(--text3)',
              fontFamily: 'var(--font-display)', transition: 'color 0.15s',
            }}>
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ background: 'rgba(251,191,36,0.1)', borderBottom: '1px solid rgba(251,191,36,0.2)', padding: '7px 16px', textAlign: 'center' }}>
          <span style={{ color: 'var(--yellow)', fontSize: 13 }}>
            ⚠️ Không kết nối được Firebase. Kiểm tra Environment Variables và Firestore Rules.
          </span>
        </div>
      )}

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '20px 16px 80px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTab && <activeTab.icon size={20} style={{ color: activeTab.color }} />}
            {activeTab?.label}
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 3 }}>
            {tab === 'vocab'     && `Bộ từ vựng của ${username} (${vocab.length} từ)`}
            {tab === 'quiz'      && 'Kiểm tra từ vựng ngẫu nhiên'}
            {tab === 'sentences' && `Câu luyện tập của ${username} (${sentences.length} câu)`}
            {tab === 'practice'  && 'Luyện dịch câu tiếng Anh ↔ Việt'}
            {tab === 'settings'  && 'Cài đặt và sao lưu dữ liệu'}
          </p>
        </div>

        {tab === 'vocab'     && <VocabManager vocab={vocab} saveItem={saveVocab} removeItem={removeVocab} />}
        {tab === 'quiz'      && <VocabQuiz vocab={vocab} />}
        {tab === 'sentences' && <SentenceManager sentences={sentences} saveItem={saveSentence} removeItem={removeSentence} />}
        {tab === 'practice'  && <SentencePractice sentences={sentences} apiKey={apiKey} />}
        {tab === 'settings'  && (
          <Settings
            apiKey={apiKey} setApiKey={setApiKey}
            vocab={vocab}   sentences={sentences}
            saveVocab={saveVocab}     removeVocab={removeVocab}
            saveSentence={saveSentence} removeSentence={removeSentence}
            username={username}
          />
        )}
      </main>

      <style>{`
        /* Desktop: show nav in header, hide mobile nav */
        .desktop-nav { display: flex !important; }
        .mobile-nav  { display: none !important; }
        .logo-text   { display: inline !important; }
        .username-badge { display: flex !important; }

        @media (max-width: 640px) {
          .desktop-nav    { display: none !important; }
          .mobile-nav     { display: flex !important; }
          .tab-label      { display: none; }
          .username-badge { display: none !important; }
          .logo-text      { display: inline !important; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus { border-color: var(--accent) !important; }
      `}</style>
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) setUsername(session.username);
    setChecking(false);
  }, []);

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Loader size={28} style={{ color: 'var(--accent3)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!username) return <Login onLogin={u => setUsername(u)} />;
  return <AppInner username={username} onLogout={() => { logout(); setUsername(null); }} />;
}
