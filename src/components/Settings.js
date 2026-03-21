import React, { useState, useRef } from 'react';
import { Save, Eye, EyeOff, Trash2, Download, Upload, Copy, Check } from 'lucide-react';
import { genId } from '../hooks/useFirestore';

export default function Settings({
  apiKey, setApiKey, username,
  vocab, sentences,
  saveVocab, removeVocab, saveSentence, removeSentence,
}) {
  const [key, setKey]       = useState(apiKey);
  const [show, setShow]     = useState(false);
  const [saved, setSaved]   = useState(false);
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const handleSave = () => {
    setApiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify({
      version: '1.0', exportedAt: new Date().toISOString(),
      exportedBy: username, vocabulary: vocab, sentences,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `lexilearn_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImportAll = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        let vocabItems = [], sentenceItems = [];
        if (parsed.vocabulary) { vocabItems = parsed.vocabulary; sentenceItems = parsed.sentences || []; }
        else if (Array.isArray(parsed)) { vocabItems = parsed; }
        else { alert('File không hợp lệ!'); return; }
        if (!window.confirm(`Tìm thấy ${vocabItems.length} từ và ${sentenceItems.length} câu.\nImport? (từ trùng sẽ bị bỏ qua)`)) return;
        setImporting(true);
        let addedV = 0, addedS = 0;
        for (const item of vocabItems.filter(i => i.english && i.vietnamese)) {
          if (!vocab.find(v => v.english.toLowerCase() === item.english.toLowerCase())) {
            await saveVocab({ ...item, id: genId() }); addedV++;
          }
        }
        for (const item of sentenceItems.filter(i => i.english && i.vietnamese)) {
          if (!sentences.find(s => s.english.toLowerCase() === item.english.toLowerCase())) {
            await saveSentence({ ...item, id: genId(), tags: Array.isArray(item.tags) ? item.tags : [] }); addedS++;
          }
        }
        setImporting(false);
        alert(`Import thành công!\n+${addedV} từ vựng\n+${addedS} câu`);
      } catch { setImporting(false); alert('Lỗi đọc file!'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copyHashScript = () => {
    const s = `async function hashPw(pw) {\n  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));\n  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');\n}\nhashPw('NHAP_MAT_KHAU_O_DAY').then(console.log);`;
    navigator.clipboard.writeText(s).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const clearVocab = async () => {
    if (!window.confirm(`Xoá toàn bộ ${vocab.length} từ vựng?`)) return;
    for (const v of vocab) await removeVocab(v.id);
  };
  const clearSentences = async () => {
    if (!window.confirm(`Xoá toàn bộ ${sentences.length} câu?`)) return;
    for (const s of sentences) await removeSentence(s.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>

      {/* Account */}
      <div style={card}>
        <h3 style={{ ...title, color: 'var(--green)' }}>👤 Tài khoản</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 24 }}>🔐</span>
          <div>
            <p style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent3)' }}>{username}</p>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>Đang đăng nhập · Dữ liệu đồng bộ qua Firebase</p>
          </div>
        </div>
      </div>

      {/* Hash tool */}
      <div style={card}>
        <h3 style={{ ...title, color: 'var(--accent2)' }}>🔑 Tạo mật khẩu mới</h3>
        <p style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
          Để đổi mật khẩu: copy script → mở F12 Console → chạy → copy hash → cập nhật <code style={{ color: 'var(--accent3)' }}>REACT_APP_ACCOUNTS</code> trên Vercel.
        </p>
        <button onClick={copyHashScript} style={{ ...btnSmall, background: 'rgba(167,139,250,0.15)', color: 'var(--accent2)', border: '1px solid rgba(167,139,250,0.3)' }}>
          {copied ? <><Check size={13} /> Đã copy!</> : <><Copy size={13} /> Copy script tạo hash</>}
        </button>
      </div>

      {/* AI Key */}
      <div style={card}>
        <h3 style={{ ...title, color: 'var(--accent3)' }}>🤖 Anthropic API Key</h3>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
          Dùng cho nhận xét ngữ pháp AI. Lấy tại{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent2)' }}>console.anthropic.com</a>.
          Lưu cục bộ trên trình duyệt, không sync Firebase.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input value={key} onChange={e => setKey(e.target.value)}
              type={show ? 'text' : 'password'} placeholder="sk-ant-api..."
              style={{ ...inputStyle, paddingRight: 40, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
            <button onClick={() => setShow(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex' }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button onClick={handleSave} style={{ ...btnPrimary, background: saved ? 'var(--green)' : 'var(--accent)', flexShrink: 0 }}>
            <Save size={14} /> {saved ? 'Đã lưu!' : 'Lưu'}
          </button>
        </div>
        {apiKey
          ? <p style={{ color: 'var(--green)', fontSize: 12, marginTop: 8 }}>✅ API key đã được cấu hình.</p>
          : <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 8 }}>⚠️ Chưa có API key.</p>}
      </div>

      {/* Backup */}
      <div style={card}>
        <h3 style={{ ...title, color: 'var(--cyan)' }}>💾 Sao lưu dữ liệu</h3>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 14 }}>
          Export toàn bộ ra file JSON để backup hoặc dùng ở máy khác.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleExportAll} disabled={vocab.length === 0 && sentences.length === 0} style={btnCyan}>
            <Download size={14} /> Export ({vocab.length} từ + {sentences.length} câu)
          </button>
          <button onClick={() => fileRef.current.click()} disabled={importing} style={btnSecondary}>
            <Upload size={14} /> {importing ? 'Đang import...' : 'Import backup'}
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImportAll} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={card}>
        <h3 style={{ ...title, color: 'var(--text2)' }}>📊 Thống kê</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[{ label: 'Từ vựng', val: vocab.length, color: 'var(--accent3)' }, { label: 'Câu luyện tập', val: sentences.length, color: 'var(--cyan)' }].map(s => (
            <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
              <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger */}
      <div style={{ ...card, borderColor: 'rgba(248,113,113,0.25)' }}>
        <h3 style={{ ...title, color: 'var(--red)' }}>⚠️ Xoá dữ liệu</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={clearVocab} disabled={vocab.length === 0} style={{ ...btnDanger, opacity: vocab.length === 0 ? 0.4 : 1 }}>
            <Trash2 size={13} /> Xoá từ vựng
          </button>
          <button onClick={clearSentences} disabled={sentences.length === 0} style={{ ...btnDanger, opacity: sentences.length === 0 ? 0.4 : 1 }}>
            <Trash2 size={13} /> Xoá câu
          </button>
        </div>
      </div>
    </div>
  );
}

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 };
const title = { fontWeight: 800, fontSize: 14, marginBottom: 12, letterSpacing: 0.3 };
const inputStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', fontFamily: 'var(--font-display)' };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const btnCyan = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--cyan)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const btnSecondary = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const btnDanger = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: 'var(--red)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const btnSmall = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' };
