import React, { useState } from 'react';
import './index.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import VocabManager from './components/VocabManager';
import VocabQuiz from './components/VocabQuiz';
import SentenceManager from './components/SentenceManager';
import SentencePractice from './components/SentencePractice';
import Settings from './components/Settings';
import { BookOpen, Zap, MessageSquare, PenTool, Settings as SettingsIcon } from 'lucide-react';

const TABS = [
  { id: 'vocab', label: 'Từ Vựng', icon: BookOpen, color: 'var(--accent)' },
  { id: 'quiz', label: 'Luyện Từ', icon: Zap, color: 'var(--accent3)' },
  { id: 'sentences', label: 'Câu', icon: MessageSquare, color: 'var(--cyan)' },
  { id: 'practice', label: 'Luyện Câu', icon: PenTool, color: 'var(--cyan)' },
  { id: 'settings', label: 'Cài Đặt', icon: SettingsIcon, color: 'var(--text3)' },
];

export default function App() {
  const [tab, setTab] = useState('vocab');
  const [vocab, setVocab] = useLocalStorage('ll_vocab', []);
  const [sentences, setSentences] = useLocalStorage('ll_sentences', []);
  const [apiKey, setApiKey] = useLocalStorage('ll_apikey', '');

  const activeTab = TABS.find(t => t.id === tab);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5, background: 'linear-gradient(90deg, var(--accent3), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LexiLearn</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                    border: isActive ? '1px solid var(--border2)' : '1px solid transparent',
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    color: isActive ? t.color : 'var(--text3)', fontWeight: isActive ? 700 : 500,
                    fontSize: 13, fontFamily: 'var(--font-display)'
                  }}>
                  <Icon size={15} />
                  <span className="tab-label">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '28px 20px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeTab && <activeTab.icon size={24} style={{ color: activeTab.color }} />}
            {activeTab?.label}
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>
            {tab === 'vocab' && `Quản lý bộ từ vựng của bạn (${vocab.length} từ)`}
            {tab === 'quiz' && 'Kiểm tra từ vựng ngẫu nhiên'}
            {tab === 'sentences' && `Quản lý câu luyện tập (${sentences.length} câu)`}
            {tab === 'practice' && 'Luyện dịch câu tiếng Anh ↔ Việt'}
            {tab === 'settings' && 'Cài đặt API và sao lưu dữ liệu'}
          </p>
        </div>

        {tab === 'vocab' && <VocabManager vocab={vocab} setVocab={setVocab} />}
        {tab === 'quiz' && <VocabQuiz vocab={vocab} />}
        {tab === 'sentences' && <SentenceManager sentences={sentences} setSentences={setSentences} />}
        {tab === 'practice' && <SentencePractice sentences={sentences} apiKey={apiKey} />}
        {tab === 'settings' && <Settings apiKey={apiKey} setApiKey={setApiKey} vocab={vocab} sentences={sentences} setVocab={setVocab} setSentences={setSentences} />}
      </main>

      <style>{`
        @media (max-width: 600px) {
          .tab-label { display: none; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        input:focus, textarea:focus, select:focus { border-color: var(--accent) !important; }
      `}</style>
    </div>
  );
}
