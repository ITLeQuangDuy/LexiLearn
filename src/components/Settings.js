import React, { useState } from 'react';
import { Save, Eye, EyeOff, Trash2, Download, Upload } from 'lucide-react';

export default function Settings({ apiKey, setApiKey, vocab, sentences, setVocab, setSentences }) {
  const [key, setKey] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportAll = () => {
    const data = JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), vocabulary: vocab, sentences }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `lexilearn_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImportAll = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        let vocabItems = [], sentenceItems = [];
        if (parsed.vocabulary) { vocabItems = parsed.vocabulary; sentenceItems = parsed.sentences || []; }
        else if (Array.isArray(parsed)) { vocabItems = parsed; }
        else { alert('File không hợp lệ!'); return; }
        if (window.confirm(`Tìm thấy ${vocabItems.length} từ vựng và ${sentenceItems.length} câu. Import toàn bộ? (Dữ liệu cũ sẽ được giữ lại, chỉ thêm mới)`)) {
          const mergedV = [...vocab]; let addedV = 0;
          vocabItems.forEach(i => { if (i.english && i.vietnamese && !mergedV.find(v => v.english.toLowerCase() === i.english.toLowerCase())) { mergedV.push({ ...i, id: i.id || Date.now() + Math.random() }); addedV++; } });
          const mergedS = [...sentences]; let addedS = 0;
          sentenceItems.forEach(i => { if (i.english && i.vietnamese && !mergedS.find(s => s.english.toLowerCase() === i.english.toLowerCase())) { mergedS.push({ ...i, id: i.id || Date.now() + Math.random(), tags: Array.isArray(i.tags) ? i.tags : [] }); addedS++; } });
          setVocab(mergedV); setSentences(mergedS);
          alert(`Import thành công!\nThêm ${addedV} từ vựng mới\nThêm ${addedS} câu mới`);
        }
      } catch { alert('Lỗi đọc file!'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const fileRef = React.useRef();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      {/* API Key */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: 'var(--accent3)' }}>🤖 Anthropic API Key</h3>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Để dùng tính năng nhận xét ngữ pháp AI khi luyện viết câu, bạn cần API key từ{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent2)' }}>console.anthropic.com</a>.
          Key được lưu trên máy bạn, không gửi đi đâu ngoài Anthropic API.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input value={key} onChange={e => setKey(e.target.value)}
              type={show ? 'text' : 'password'}
              placeholder="sk-ant-api..."
              style={{ ...inputStyle, paddingRight: 42, fontFamily: 'var(--font-mono)' }} />
            <button onClick={() => setShow(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex' }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button onClick={handleSave} style={{ ...btnPrimary, background: saved ? 'var(--green)' : 'var(--accent)', whiteSpace: 'nowrap' }}>
            <Save size={16} /> {saved ? 'Đã lưu!' : 'Lưu key'}
          </button>
        </div>
        {apiKey && <p style={{ color: 'var(--green)', fontSize: 13, marginTop: 10 }}>✅ API key đã được cấu hình. Tính năng nhận xét AI đang hoạt động.</p>}
        {!apiKey && <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 10 }}>⚠️ Chưa có API key. Tính năng nhận xét AI sẽ bị tắt.</p>}
      </div>

      {/* Backup */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: 'var(--cyan)' }}>💾 Sao lưu toàn bộ dữ liệu</h3>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Export toàn bộ từ vựng và câu thành một file JSON duy nhất để backup hoặc chuyển sang máy khác.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleExportAll} disabled={vocab.length === 0 && sentences.length === 0} style={{ ...btnCyan }}>
            <Download size={16} /> Export tất cả ({vocab.length} từ + {sentences.length} câu)
          </button>
          <button onClick={() => fileRef.current.click()} style={btnSecondary}>
            <Upload size={16} /> Import backup
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImportAll} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: 'var(--text2)' }}>📊 Thống kê</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Từ vựng', val: vocab.length, color: 'var(--accent3)' },
            { label: 'Câu luyện tập', val: sentences.length, color: 'var(--cyan)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
              <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Clear data */}
      <div style={{ background: 'var(--card)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: 'var(--red)' }}>⚠️ Xoá dữ liệu</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { if (window.confirm('Xoá toàn bộ từ vựng?')) setVocab([]); }}
            style={{ ...btnDanger, opacity: vocab.length === 0 ? 0.4 : 1 }} disabled={vocab.length === 0}>
            <Trash2 size={14} /> Xoá từ vựng
          </button>
          <button onClick={() => { if (window.confirm('Xoá toàn bộ câu luyện tập?')) setSentences([]); }}
            style={{ ...btnDanger, opacity: sentences.length === 0 ? 0.4 : 1 }} disabled={sentences.length === 0}>
            <Trash2 size={14} /> Xoá câu
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '10px 14px', fontSize: 14, outline: 'none', width: '100%' };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' };
const btnCyan = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--cyan)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer' };
const btnSecondary = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const btnDanger = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: 'var(--red)', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
