import React, { useState } from 'react';
import { Event, Category } from '../types';
import { useIsMobile } from '../hooks/useMediaQuery';

interface Props {
  onSave: (event: Omit<Event, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  initial?: Event;
  defaultDate?: string;
}

const CATEGORIES: Category[] = ['work', 'personal', 'health', 'other'];
const CATEGORY_LABELS: Record<Category, string> = {
  work: '업무', personal: '개인', health: '건강', other: '기타',
};
const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function EventModal({ onSave, onClose, initial, defaultDate }: Props) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [date, setDate] = useState(initial?.date || defaultDate || '');
  const [startTime, setStartTime] = useState(initial?.startTime || '');
  const [endTime, setEndTime] = useState(initial?.endTime || '');
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [category, setCategory] = useState<Category>(initial?.category || 'personal');
  const [reminder, setReminder] = useState<number | ''>(initial?.reminder ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      color,
      category,
      reminder: reminder !== '' ? Number(reminder) : undefined,
    });
    onClose();
  };

  return (
    <div style={{ ...styles.overlay, alignItems: isMobile ? 'flex-end' : 'center' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, borderRadius: isMobile ? '20px 20px 0 0' : 16, maxWidth: isMobile ? '100%' : 480, paddingBottom: isMobile ? 36 : 28 }}>
        {isMobile && <div style={styles.handle} />}
        <h2 style={styles.title}>{initial ? '일정 수정' : '새 일정'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>제목 *</label>
            <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="일정 제목" autoFocus />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>설명</label>
            <textarea style={{ ...styles.input, height: 72, resize: 'none' }}
              value={description} onChange={e => setDescription(e.target.value)} placeholder="상세 내용 (선택)" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>날짜 *</label>
            <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>시작 시간</label>
              <input style={styles.input} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>종료 시간</label>
              <input style={styles.input} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>카테고리</label>
              <select style={styles.select} value={category} onChange={e => setCategory(e.target.value as Category)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>알림 (분 전)</label>
              <select style={styles.select} value={reminder} onChange={e => setReminder(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">알림 없음</option>
                <option value={5}>5분 전</option>
                <option value={10}>10분 전</option>
                <option value={30}>30분 전</option>
                <option value={60}>1시간 전</option>
                <option value={1440}>1일 전</option>
              </select>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>색상</label>
            <div style={styles.colorRow}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ ...styles.colorDot, background: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>취소</button>
            <button type="submit" style={styles.saveBtn}>저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: 28, width: '100%', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '92vh', overflowY: 'auto' },
  handle: { width: 40, height: 4, borderRadius: 2, background: '#d1d5db', margin: '-8px auto 16px' },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1a1a2e' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  select: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', background: '#fff' },
  row: { display: 'flex', gap: 12 },
  colorRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer' },
  actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
};
