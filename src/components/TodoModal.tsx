import React, { useState } from 'react';
import { Todo, Category } from '../types';

interface Props {
  onSave: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  initial?: Todo;
}

const CATEGORIES: Category[] = ['work', 'personal', 'health', 'other'];
const CATEGORY_LABELS: Record<Category, string> = {
  work: '업무', personal: '개인', health: '건강', other: '기타',
};

export default function TodoModal({ onSave, onClose, initial }: Props) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [important, setImportant] = useState(initial?.important ?? true);
  const [category, setCategory] = useState<Category>(initial?.category || 'personal');
  const [dueDate, setDueDate] = useState(initial?.dueDate || '');
  const [dueTime, setDueTime] = useState(initial?.dueTime || '');
  const [reminder, setReminder] = useState<number | ''>(initial?.reminder ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      completed: initial?.completed || false,
      important,
      category,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      reminder: reminder !== '' ? Number(reminder) : undefined,
    });
    onClose();
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <h2 style={s.title}>{initial ? '할 일 수정' : '새 할 일'}</h2>
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>제목 *</label>
            <input style={s.input} value={title} onChange={e => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요" autoFocus />
          </div>

          <div style={s.field}>
            <label style={s.label}>설명</label>
            <textarea style={{ ...s.input, height: 64, resize: 'none' }}
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="상세 내용 (선택)" />
          </div>

          <div style={s.field}>
            <label style={s.label}>중요도</label>
            <div style={s.importanceRow}>
              <button type="button"
                onClick={() => setImportant(true)}
                style={{ ...s.importanceBtn, ...(important ? s.importanceActive : s.importanceInactive) }}>
                <span style={s.importanceIcon}>⭐</span>
                <div>
                  <div style={s.importanceName}>중요</div>
                  <div style={s.importanceHint}>꼭 해야 하는 일</div>
                </div>
              </button>
              <button type="button"
                onClick={() => setImportant(false)}
                style={{ ...s.importanceBtn, ...(!important ? s.importanceActiveGray : s.importanceInactive) }}>
                <span style={s.importanceIcon}>📋</span>
                <div>
                  <div style={s.importanceName}>덜 중요</div>
                  <div style={s.importanceHint}>나중에 해도 되는 일</div>
                </div>
              </button>
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>마감일 <span style={s.hint}>— 1개월 이내면 자동으로 "급함" 분류</span></label>
            <div style={s.row}>
              <input style={{ ...s.input, flex: 1 }} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              <input style={{ ...s.input, flex: 1 }} type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>카테고리</label>
            <select style={s.select} value={category} onChange={e => setCategory(e.target.value as Category)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>알림 (분 전)</label>
            <select style={s.select} value={reminder} onChange={e => setReminder(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">알림 없음</option>
              <option value={5}>5분 전</option>
              <option value={10}>10분 전</option>
              <option value={30}>30분 전</option>
              <option value={60}>1시간 전</option>
              <option value={1440}>1일 전</option>
            </select>
          </div>

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>취소</button>
            <button type="submit" style={s.saveBtn}>저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '92vh', overflowY: 'auto' },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1a1a2e' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  hint: { fontSize: 11, fontWeight: 400, color: '#9ca3af' },
  input: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  select: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', background: '#fff' },
  row: { display: 'flex', gap: 10 },
  importanceRow: { display: 'flex', gap: 10 },
  importanceBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '2px solid', cursor: 'pointer', textAlign: 'left' },
  importanceActive: { background: '#fffbeb', borderColor: '#f59e0b', color: '#92400e' },
  importanceActiveGray: { background: '#f9fafb', borderColor: '#9ca3af', color: '#374151' },
  importanceInactive: { background: '#fff', borderColor: '#e5e7eb', color: '#9ca3af' },
  importanceIcon: { fontSize: 22, flexShrink: 0 },
  importanceName: { fontSize: 13, fontWeight: 700 },
  importanceHint: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
};
