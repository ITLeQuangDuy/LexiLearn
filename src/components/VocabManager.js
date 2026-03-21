import React, { useState, useRef } from 'react';
import { Plus, Trash2, Upload, Download, Search, Edit2, Check, X } from 'lucide-react';
import { genId } from '../hooks/useFirestore';

const WORD_TYPES = ['n', 'v', 'adj', 'adv', 'prep', 'conj', 'pron', 'interj', 'phrase'];
const TYPE_LABELS = { n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'trạng từ', prep: 'giới từ', conj: 'liên từ', pron: 'đại từ', interj: 'thán từ', phrase: 'cụm từ' };
const defaultForm = { english: '', vietnamese: '', type: 'n', example: '', exampleVi: '' };

export default function VocabManager({ vocab, saveItem, removeItem }) {
  const [form, setForm]     = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleAdd = async () => {
    if (!form.english.trim() || !form.vietnamese.trim()) {
      setError('Vui lòng nhập từ tiếng Anh và nghĩa tiếng Việt.'); return;
    }
    const exists = vocab.find(v => v.english.toLowerCase() === form.english.trim().toLowerCase());
    if (exists) { setError('Từ này đã tồn tại!'); return; }
    setSaving(true);
    await saveItem({
      id: genId(),
      english: form.english.trim(),
      vietnamese: form.vietnamese.trim(),
      type: form.type,
      example: form.example.trim(),
      exampleVi: form.exampleVi.trim(),
      createdAt: new Date().toISOString(),
    });
    setForm(defaultForm);
    setError('');
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await removeItem(id);
  };

  const startEdit = (v) => {
    setEditId(v.id);
    setEditForm({ english: v.english, vietnamese: v.vietnamese, type: v.type, example: v.example || '', exampleVi: v.exampleVi || '' });
  };
  const saveEdit = async (item) => {
    if (!editForm.english.trim() || !editForm.vietnamese.trim()) return;
    await saveItem({ ...item, ...editForm });
    setEditId(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ version: '1.0', type: 'vocabulary', data: vocab }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `vocab_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const items = parsed.data || parsed;
        if (!Array.isArray(items)) { alert('File không hợp lệ!'); return; }
        const valid = items.filter(i => i.english && i.vietnamese);
        let added = 0;
        for (const item of valid) {
          const dup = vocab.find(v => v.english.toLowerCase() === item.english.toLowerCase());
          if (!dup) {
            await saveItem({ ...item, id: genId() });
            added++;
          }
        }
        alert(`Import xong! Thêm ${added} từ mới, bỏ qua ${valid.length - added} từ trùng.`);
      } catch { alert('Lỗi đọc file JSON!'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = vocab.filter(v =>
    v.english.toLowerCase().includes(search.toLowerCase()) ||
    v.vietnamese.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Add form */}
      <div style={card}>
        <h3 style={cardTitle}>➕ Thêm từ mới</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 10 }}>
          <input value={form.english} onChange={e => setForm(p => ({ ...p, english: e.target.value }))}
            placeholder="Từ tiếng Anh *" onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={inputStyle} />
          <input value={form.vietnamese} onChange={e => setForm(p => ({ ...p, vietnamese: e.target.value }))}
            placeholder="Nghĩa tiếng Việt *" onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={inputStyle} />
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
            {WORD_TYPES.map(t => <option key={t} value={t}>{t} – {TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
          <input value={form.example} onChange={e => setForm(p => ({ ...p, example: e.target.value }))}
            placeholder="Câu ví dụ tiếng Anh (tuỳ chọn)" style={inputStyle} />
          <input value={form.exampleVi} onChange={e => setForm(p => ({ ...p, exampleVi: e.target.value }))}
            placeholder="Câu ví dụ tiếng Việt (tuỳ chọn)" style={inputStyle} />
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleAdd} disabled={saving} style={btnPrimary}>
            {saving ? '⏳' : <Plus size={15} />} {saving ? 'Đang lưu...' : 'Thêm từ'}
          </button>
          <button onClick={handleExport} disabled={vocab.length === 0} style={btnSecondary}>
            <Download size={15} /> Export
          </button>
          <button onClick={() => fileRef.current.click()} style={btnSecondary}>
            <Upload size={15} /> Import
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <span style={{ marginLeft: 'auto', alignSelf: 'center', color: 'var(--text3)', fontSize: 13 }}>
            {vocab.length} từ
          </span>
        </div>
      </div>

      {/* Search + List */}
      {vocab.length > 0 && (
        <div style={card}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..." style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
            {filtered.map(v => (
              <div key={v.id} style={itemRow}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                {editId === v.id ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
                    <input value={editForm.english} onChange={e => setEditForm(p => ({ ...p, english: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
                    <input value={editForm.vietnamese} onChange={e => setEditForm(p => ({ ...p, vietnamese: e.target.value }))} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
                    <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))} style={{ ...inputStyle, width: 80 }}>
                      {WORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => saveEdit(v)} style={{ ...iconBtn, color: 'var(--green)' }}><Check size={16} /></button>
                    <button onClick={() => setEditId(null)} style={{ ...iconBtn, color: 'var(--text3)' }}><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent3)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{v.english}</span>
                      <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 6, fontStyle: 'italic' }}>({v.type})</span>
                    </div>
                    <div style={{ flex: 1, color: 'var(--text2)', fontSize: 14 }}>{v.vietnamese}</div>
                    {v.example && <div style={{ flex: 1.5, color: 'var(--text3)', fontSize: 12, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{v.example}"</div>}
                    <button onClick={() => startEdit(v)} style={{ ...iconBtn, color: 'var(--accent2)' }}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(v.id)} style={{ ...iconBtn, color: 'var(--red)' }}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {vocab.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <p>Bộ từ vựng trống. Hãy thêm từ đầu tiên!</p>
        </div>
      )}
    </div>
  );
}

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 };
const cardTitle = { fontWeight: 800, fontSize: 15, marginBottom: 14, color: 'var(--accent3)', letterSpacing: 0.5, textTransform: 'uppercase' };
const inputStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', fontFamily: 'var(--font-display)' };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const btnSecondary = { display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const iconBtn = { background: 'none', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' };
const itemRow = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s', flexWrap: 'wrap' };
