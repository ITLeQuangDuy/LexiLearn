import React, { useState, useRef } from 'react';
import { Plus, Trash2, Upload, Download, Search, Edit2, Check, X } from 'lucide-react';

const defaultForm = { english: '', vietnamese: '', tags: '', difficulty: 'medium' };
const DIFFICULTIES = [
  { value: 'easy', label: '🟢 Dễ', color: '#4ade80' },
  { value: 'medium', label: '🟡 Trung bình', color: '#fbbf24' },
  { value: 'hard', label: '🔴 Khó', color: '#f87171' },
];

export default function SentenceManager({ sentences, setSentences }) {
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleAdd = () => {
    if (!form.english.trim() || !form.vietnamese.trim()) {
      setError('Vui lòng nhập câu tiếng Anh và tiếng Việt.');
      return;
    }
    setSentences(prev => [...prev, {
      ...form, id: Date.now(),
      english: form.english.trim(),
      vietnamese: form.vietnamese.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    }]);
    setForm(defaultForm); setError('');
  };

  const handleDelete = (id) => setSentences(prev => prev.filter(s => s.id !== id));

  const startEdit = (s) => {
    setEditId(s.id);
    setEditForm({ english: s.english, vietnamese: s.vietnamese, tags: Array.isArray(s.tags) ? s.tags.join(', ') : s.tags || '', difficulty: s.difficulty || 'medium' });
  };
  const saveEdit = (id) => {
    if (!editForm.english.trim() || !editForm.vietnamese.trim()) return;
    setSentences(prev => prev.map(s => s.id === id ? { ...s, ...editForm, tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean) } : s));
    setEditId(null);
  };

  const handleExport = () => {
    const data = JSON.stringify({ version: '1.0', type: 'sentences', data: sentences }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `sentences_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const items = parsed.data || parsed;
        if (!Array.isArray(items)) { alert('File không hợp lệ!'); return; }
        const valid = items.filter(i => i.english && i.vietnamese);
        const merged = [...sentences]; let added = 0;
        valid.forEach(item => {
          if (!merged.find(s => s.english.toLowerCase() === item.english.toLowerCase())) {
            merged.push({ ...item, id: item.id || Date.now() + Math.random(), tags: Array.isArray(item.tags) ? item.tags : [] });
            added++;
          }
        });
        setSentences(merged);
        alert(`Đã import thành công! Thêm ${added} câu mới.`);
      } catch { alert('Lỗi đọc file!'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = sentences.filter(s =>
    s.english.toLowerCase().includes(search.toLowerCase()) ||
    s.vietnamese.toLowerCase().includes(search.toLowerCase()) ||
    (Array.isArray(s.tags) && s.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const difficultyColor = (d) => DIFFICULTIES.find(x => x.value === d)?.color || '#a0a0c0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Add form */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: 'var(--cyan)', letterSpacing: 1, textTransform: 'uppercase' }}>➕ Thêm câu mới</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea value={form.english} onChange={e => setForm(p => ({ ...p, english: e.target.value }))}
            placeholder="Câu tiếng Anh *" rows={2} style={textareaStyle} />
          <textarea value={form.vietnamese} onChange={e => setForm(p => ({ ...p, vietnamese: e.target.value }))}
            placeholder="Câu tiếng Việt *" rows={2} style={textareaStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="Tags (cách nhau bằng dấu phẩy): thì hiện tại, giao tiếp..." style={inputStyle} />
            <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} style={{ ...inputStyle, width: 160 }}>
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button onClick={handleAdd} style={btnPrimary}><Plus size={16} /> Thêm câu</button>
          <button onClick={handleExport} disabled={sentences.length === 0} style={btnSecondary}><Download size={16} /> Export JSON</button>
          <button onClick={() => fileRef.current.click()} style={btnSecondary}><Upload size={16} /> Import JSON</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          <span style={{ marginLeft: 'auto', alignSelf: 'center', color: 'var(--text3)', fontSize: 13 }}>{sentences.length} câu</span>
        </div>
      </div>

      {/* List */}
      {sentences.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm câu..."
              style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
            {filtered.map(s => (
              <div key={s.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cyan)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                {editId === s.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea value={editForm.english} onChange={e => setEditForm(p => ({ ...p, english: e.target.value }))} rows={2} style={textareaStyle} />
                    <textarea value={editForm.vietnamese} onChange={e => setEditForm(p => ({ ...p, vietnamese: e.target.value }))} rows={2} style={textareaStyle} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={editForm.tags} onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))} placeholder="Tags..." style={{ ...inputStyle, flex: 1 }} />
                      <select value={editForm.difficulty} onChange={e => setEditForm(p => ({ ...p, difficulty: e.target.value }))} style={{ ...inputStyle, width: 140 }}>
                        {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      <button onClick={() => saveEdit(s.id)} style={{ ...iconBtn, color: 'var(--green)' }}><Check size={16} /></button>
                      <button onClick={() => setEditId(null)} style={{ ...iconBtn, color: 'var(--text3)' }}><X size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--cyan)', marginBottom: 4, lineHeight: 1.6 }}>{s.english}</p>
                        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{s.vietnamese}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: difficultyColor(s.difficulty || 'medium'), fontWeight: 700 }}>
                            {DIFFICULTIES.find(d => d.value === (s.difficulty || 'medium'))?.label}
                          </span>
                          {Array.isArray(s.tags) && s.tags.map(t => (
                            <span key={t} style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => startEdit(s)} style={{ ...iconBtn, color: 'var(--accent2)' }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(s.id)} style={{ ...iconBtn, color: 'var(--red)' }}><Trash2 size={14} /></button>
                      </div>
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
          <p style={{ fontSize: 16 }}>Chưa có câu nào. Hãy thêm câu đầu tiên!</p>
        </div>
      )}
    </div>
  );
}

const inputStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '10px 14px', fontSize: 14, outline: 'none', width: '100%' };
const textareaStyle = { ...inputStyle, resize: 'vertical', lineHeight: 1.6 };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--cyan)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer' };
const btnSecondary = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const iconBtn = { background: 'none', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' };
