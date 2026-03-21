import React, { useState, useRef } from 'react';
import { Plus, Trash2, Upload, Download, Search, Edit2, Check, X } from 'lucide-react';
import { genId } from '../hooks/useFirestore';

const defaultForm = { english: '', vietnamese: '', tags: '', difficulty: 'medium' };
const DIFFICULTIES = [
  { value: 'easy',   label: '🟢 Dễ',       color: '#4ade80' },
  { value: 'medium', label: '🟡 Trung bình', color: '#fbbf24' },
  { value: 'hard',   label: '🔴 Khó',       color: '#f87171' },
];

export default function SentenceManager({ sentences, saveItem, removeItem }) {
  const [form, setForm]     = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleAdd = async () => {
    if (!form.english.trim() || !form.vietnamese.trim()) {
      setError('Vui lòng nhập câu tiếng Anh và tiếng Việt.'); return;
    }
    setSaving(true);
    await saveItem({
      id: genId(),
      english: form.english.trim(),
      vietnamese: form.vietnamese.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      difficulty: form.difficulty,
      createdAt: new Date().toISOString(),
    });
    setForm(defaultForm); setError(''); setSaving(false);
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setEditForm({ english: s.english, vietnamese: s.vietnamese, tags: Array.isArray(s.tags) ? s.tags.join(', ') : '', difficulty: s.difficulty || 'medium' });
  };
  const saveEdit = async (item) => {
    if (!editForm.english.trim() || !editForm.vietnamese.trim()) return;
    await saveItem({ ...item, ...editForm, tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean) });
    setEditId(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ version: '1.0', type: 'sentences', data: sentences }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `sentences_${new Date().toISOString().split('T')[0]}.json`;
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
          const dup = sentences.find(s => s.english.toLowerCase() === item.english.toLowerCase());
          if (!dup) { await saveItem({ ...item, id: genId(), tags: Array.isArray(item.tags) ? item.tags : [] }); added++; }
        }
        alert(`Import xong! Thêm ${added} câu mới.`);
      } catch { alert('Lỗi đọc file JSON!'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = sentences.filter(s =>
    s.english.toLowerCase().includes(search.toLowerCase()) ||
    s.vietnamese.toLowerCase().includes(search.toLowerCase()) ||
    (Array.isArray(s.tags) && s.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const diffColor = (d) => DIFFICULTIES.find(x => x.value === d)?.color || '#a0a0c0';
  const diffLabel = (d) => DIFFICULTIES.find(x => x.value === d)?.label || d;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card}>
        <h3 style={{ ...cardTitle, color: 'var(--cyan)' }}>➕ Thêm câu mới</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea value={form.english} onChange={e => setForm(p => ({ ...p, english: e.target.value }))}
            placeholder="Câu tiếng Anh *" rows={2} style={taStyle} />
          <textarea value={form.vietnamese} onChange={e => setForm(p => ({ ...p, vietnamese: e.target.value }))}
            placeholder="Câu tiếng Việt *" rows={2} style={taStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="Tags: thì hiện tại, giao tiếp..." style={inputStyle} />
            <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} style={{ ...inputStyle, width: 150 }}>
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={handleAdd} disabled={saving} style={btnCyan}>
            {saving ? '⏳' : <Plus size={15} />} {saving ? 'Đang lưu...' : 'Thêm câu'}
          </button>
          <button onClick={handleExport} disabled={sentences.length === 0} style={btnSecondary}><Download size={15} /> Export</button>
          <button onClick={() => fileRef.current.click()} style={btnSecondary}><Upload size={15} /> Import</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <span style={{ marginLeft: 'auto', alignSelf: 'center', color: 'var(--text3)', fontSize: 13 }}>{sentences.length} câu</span>
        </div>
      </div>

      {sentences.length > 0 && (
        <div style={card}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm câu..."
              style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto' }}>
            {filtered.map(s => (
              <div key={s.id} style={{ ...itemRow, flexDirection: 'column', alignItems: 'stretch' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cyan)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                {editId === s.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea value={editForm.english} onChange={e => setEditForm(p => ({ ...p, english: e.target.value }))} rows={2} style={taStyle} />
                    <textarea value={editForm.vietnamese} onChange={e => setEditForm(p => ({ ...p, vietnamese: e.target.value }))} rows={2} style={taStyle} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input value={editForm.tags} onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))} placeholder="Tags..." style={{ ...inputStyle, flex: 1 }} />
                      <select value={editForm.difficulty} onChange={e => setEditForm(p => ({ ...p, difficulty: e.target.value }))} style={{ ...inputStyle, width: 140 }}>
                        {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <button onClick={() => saveEdit(s)} style={{ ...iconBtn, color: 'var(--green)' }}><Check size={16} /></button>
                      <button onClick={() => setEditId(null)} style={{ ...iconBtn, color: 'var(--text3)' }}><X size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--cyan)', marginBottom: 4, lineHeight: 1.6 }}>{s.english}</p>
                      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{s.vietnamese}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: diffColor(s.difficulty || 'medium'), fontWeight: 700 }}>{diffLabel(s.difficulty || 'medium')}</span>
                        {Array.isArray(s.tags) && s.tags.map(t => (
                          <span key={t} style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', fontSize: 11, padding: '2px 8px', borderRadius: 10 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <button onClick={() => startEdit(s)} style={{ ...iconBtn, color: 'var(--accent2)' }}><Edit2 size={14} /></button>
                      <button onClick={() => removeItem(s.id)} style={{ ...iconBtn, color: 'var(--red)' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {sentences.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <p>Chưa có câu nào. Hãy thêm câu đầu tiên!</p>
        </div>
      )}
    </div>
  );
}

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 };
const cardTitle = { fontWeight: 800, fontSize: 15, marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' };
const inputStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '10px 12px', fontSize: 14, outline: 'none', width: '100%', fontFamily: 'var(--font-display)' };
const taStyle = { ...inputStyle, resize: 'vertical', lineHeight: 1.6 };
const btnCyan = { display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--cyan)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const btnSecondary = { display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)' };
const iconBtn = { background: 'none', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' };
const itemRow = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', transition: 'border-color 0.15s' };
