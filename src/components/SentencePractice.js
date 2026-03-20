import React, { useState, useCallback } from 'react';
import { RefreshCw, ChevronRight, Sparkles, Eye, EyeOff } from 'lucide-react';

const DIRECTIONS = [
  { id: 'vi2en', label: '🇻🇳 → 🇬🇧', desc: 'Nhìn câu tiếng Việt, dịch sang tiếng Anh' },
  { id: 'en2vi', label: '🇬🇧 → 🇻🇳', desc: 'Nhìn câu tiếng Anh, dịch sang tiếng Việt' },
  { id: 'mixed', label: '🔀 Hỗn hợp', desc: 'Ngẫu nhiên cả hai chiều' },
];

function normalize(s) {
  return s.toLowerCase().replace(/[.,!?;:'"()-]/g, '').replace(/\s+/g, ' ').trim();
}

export default function SentencePractice({ sentences, apiKey }) {
  const [direction, setDirection] = useState('vi2en');
  const [filter, setFilter] = useState('all');
  const [current, setCurrent] = useState(null);
  const [currentDir, setCurrentDir] = useState('vi2en');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null); // null | 'correct' | 'partial' | 'wrong'
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ correct: 0, partial: 0, wrong: 0, total: 0 });
  // eslint-disable-next-line no-unused-vars
  const [history, setHistory] = useState([]);
  const [started, setStarted] = useState(false);

  const availableSentences = sentences.filter(s => filter === 'all' || s.difficulty === filter);

  const pickRandom = useCallback((excludeId = null) => {
    const pool = availableSentences.filter(s => s.id !== excludeId);
    if (pool.length === 0) return availableSentences[0] || null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [availableSentences]);

  const start = () => {
    const s = pickRandom();
    if (!s) return;
    const dir = direction === 'mixed' ? (Math.random() > 0.5 ? 'vi2en' : 'en2vi') : direction;
    setCurrent(s); setCurrentDir(dir); setInput(''); setResult(null); setAiFeedback(''); setShowAnswer(false); setStarted(true);
  };

  const next = () => {
    const s = pickRandom(current?.id);
    if (!s) return;
    const dir = direction === 'mixed' ? (Math.random() > 0.5 ? 'vi2en' : 'en2vi') : direction;
    setCurrent(s); setCurrentDir(dir); setInput(''); setResult(null); setAiFeedback(''); setShowAnswer(false);
  };

  const checkAnswer = async () => {
    if (!current || result !== null) return;
    const answer = currentDir === 'vi2en' ? current.english : current.vietnamese;
    const userNorm = normalize(input);
    const answerNorm = normalize(answer);
    let verdict;
    if (userNorm === answerNorm) verdict = 'correct';
    else if (answerNorm.includes(userNorm) || userNorm.includes(answerNorm.slice(0, Math.floor(answerNorm.length * 0.7)))) verdict = 'partial';
    else verdict = 'wrong';
    setResult(verdict);
    setStats(p => ({ correct: p.correct + (verdict === 'correct' ? 1 : 0), partial: p.partial + (verdict === 'partial' ? 1 : 0), wrong: p.wrong + (verdict === 'wrong' ? 1 : 0), total: p.total + 1 }));
    setHistory(p => [...p.slice(-19), { sentence: current, userAnswer: input, correct: verdict, direction: currentDir }]);

    // AI grammar check if key is available
    if (apiKey && apiKey.trim() && currentDir === 'vi2en') {
      setAiLoading(true);
      try {
        const prompt = `Bạn là giáo viên tiếng Anh. Câu gốc tiếng Việt: "${current.vietnamese}". Đáp án chuẩn: "${current.english}". Học sinh viết: "${input}". Hãy nhận xét ngắn gọn (2-3 câu tiếng Việt): câu học sinh có đúng ngữ pháp không, có diễn đạt được ý không, gợi ý sửa nếu cần. KHÔNG cần giải thích dài dòng.`;
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 300, messages: [{ role: 'user', content: prompt }] })
        });
        const data = await res.json();
        if (data.content?.[0]?.text) setAiFeedback(data.content[0].text);
        else setAiFeedback('Không thể kết nối AI. Kiểm tra API key trong Cài đặt.');
      } catch { setAiFeedback('Lỗi kết nối AI.'); }
      setAiLoading(false);
    }
  };

  const prompt = current ? (currentDir === 'vi2en' ? current.vietnamese : current.english) : '';
  const answer = current ? (currentDir === 'vi2en' ? current.english : current.vietnamese) : '';

  if (sentences.length === 0) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text3)' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✍️</div>
      <p style={{ fontSize: 16 }}>Chưa có câu nào. Hãy thêm câu trong tab <strong style={{ color: 'var(--cyan)' }}>Câu</strong>!</p>
    </div>
  );

  if (!started) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✍️</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Luyện viết câu</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 32 }}>{sentences.length} câu trong bộ sưu tập</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {DIRECTIONS.map(d => (
            <button key={d.id} onClick={() => setDirection(d.id)} title={d.desc}
              style={{ ...modeBtn, ...(direction === d.id ? modeBtnActive : {}) }}>{d.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
          {['all', 'easy', 'medium', 'hard'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...modeBtn, ...(filter === f ? modeBtnActive : {}), fontSize: 12 }}>
              {f === 'all' ? 'Tất cả' : f === 'easy' ? '🟢 Dễ' : f === 'medium' ? '🟡 TB' : '🔴 Khó'}
            </button>
          ))}
        </div>
        {!apiKey && <p style={{ color: 'var(--yellow)', fontSize: 13, marginBottom: 20 }}>💡 Thêm API key trong <strong>Cài đặt</strong> để dùng chức năng nhận xét AI</p>}
        <button onClick={start} style={{ ...btnCyan, margin: '0 auto', fontSize: 16, padding: '14px 36px' }}>
          Bắt đầu luyện tập
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {DIRECTIONS.map(d => (
          <button key={d.id} onClick={() => setDirection(d.id)} title={d.desc}
            style={{ ...modeBtn, ...(direction === d.id ? modeBtnActive : {}) }}>{d.label}</button>
        ))}
        <button onClick={() => { setStarted(false); setStats({ correct: 0, partial: 0, wrong: 0, total: 0 }); setHistory([]); }}
          style={{ ...modeBtn, marginLeft: 'auto' }}><RefreshCw size={14} /></button>
      </div>

      {/* Card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 36, boxShadow: 'var(--shadow-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
          <span style={{ ...badge, background: 'rgba(34,211,238,0.15)', color: 'var(--cyan)' }}>
            {currentDir === 'vi2en' ? '🇻🇳 Dịch sang tiếng Anh' : '🇬🇧 Dịch sang tiếng Việt'}
          </span>
          <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            {stats.total} đã làm
          </span>
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.7, color: 'var(--text)', textAlign: 'center' }}>{prompt}</p>
          {current?.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              {current.tags.map(t => <span key={t} style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{t}</span>)}
            </div>
          )}
        </div>

        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) result === null ? checkAnswer() : next(); }}
          placeholder={currentDir === 'vi2en' ? "Viết câu tiếng Anh... (Ctrl+Enter để kiểm tra)" : "Viết câu tiếng Việt... (Ctrl+Enter để kiểm tra)"}
          rows={3} disabled={result !== null}
          style={{
            width: '100%', background: 'var(--bg2)', borderRadius: 10, color: 'var(--text)',
            padding: '14px 18px', fontSize: 16, outline: 'none', resize: 'vertical',
            lineHeight: 1.7, fontFamily: result !== null ? 'var(--font-mono)' : 'var(--font-display)',
            border: `2px solid ${result === 'correct' ? 'var(--green)' : result === 'partial' ? 'var(--yellow)' : result === 'wrong' ? 'var(--red)' : 'var(--border2)'}`,
            transition: 'border-color 0.2s'
          }} />

        {/* Result */}
        {result && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: result === 'correct' ? 'rgba(74,222,128,0.08)' : result === 'partial' ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${result === 'correct' ? 'rgba(74,222,128,0.2)' : result === 'partial' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: result === 'correct' ? 'var(--green)' : result === 'partial' ? 'var(--yellow)' : 'var(--red)' }}>
                {result === 'correct' ? '✅ Chính xác!' : result === 'partial' ? '🟡 Gần đúng!' : '❌ Chưa đúng'}
              </span>
              <button onClick={() => setShowAnswer(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />} {showAnswer ? 'Ẩn' : 'Xem'} đáp án
              </button>
            </div>
            {showAnswer && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>{answer}</p>}
          </div>
        )}

        {/* AI feedback */}
        {aiLoading && (
          <div style={{ marginTop: 12, padding: 14, background: 'rgba(124,107,255,0.08)', borderRadius: 10, border: '1px solid rgba(124,107,255,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} style={{ color: 'var(--accent3)' }} className="spin" />
            <span style={{ color: 'var(--text3)', fontSize: 14 }}>AI đang nhận xét...</span>
          </div>
        )}
        {aiFeedback && !aiLoading && (
          <div style={{ marginTop: 12, padding: 16, background: 'rgba(124,107,255,0.08)', borderRadius: 10, border: '1px solid rgba(124,107,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={15} style={{ color: 'var(--accent3)' }} />
              <span style={{ color: 'var(--accent3)', fontWeight: 700, fontSize: 13 }}>Nhận xét từ AI</span>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7 }}>{aiFeedback}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          {result === null ? (
            <button onClick={checkAnswer} disabled={!input.trim()} style={{ ...btnCyan, opacity: !input.trim() ? 0.5 : 1 }}>
              Kiểm tra
            </button>
          ) : (
            <button onClick={next} style={btnCyan}>
              Câu tiếp theo <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Đúng', val: stats.correct, color: 'var(--green)' },
            { label: 'Gần đúng', val: stats.partial, color: 'var(--yellow)' },
            { label: 'Sai', val: stats.wrong, color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
              <div style={{ color: 'var(--text3)', fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const modeBtn = { padding: '8px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const modeBtnActive = { background: 'rgba(34,211,238,0.15)', borderColor: 'var(--cyan)', color: 'var(--cyan)' };
const btnCyan = { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'var(--cyan)', border: 'none', borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 15, cursor: 'pointer' };
const badge = { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 };
