import React, { useState } from 'react';
import { Todo, Category, RecurringType } from '../types';
import { useIsMobile } from '../hooks/useMediaQuery';
import { classifyTodo, ClassifyResult } from '../services/classify';

interface Props {
  onSave: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  initial?: Todo;
}

const CATEGORIES: Category[] = ['work', 'personal', 'health', 'other'];
const CATEGORY_LABELS: Record<Category, string> = {
  work: '업무', personal: '개인', health: '건강', other: '기타',
};

const RECURRING_OPTIONS: { value: RecurringType; label: string; emoji: string }[] = [
  { value: 'none',    label: '반복 없음', emoji: '1️⃣' },
  { value: 'daily',   label: '매일',     emoji: '🔄' },
  { value: 'weekly',  label: '매주',     emoji: '📆' },
  { value: 'monthly', label: '매월',     emoji: '🗓️' },
];

export default function TodoModal({ onSave, onClose, initial }: Props) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [important, setImportant] = useState(initial?.important ?? true);
  const [category, setCategory] = useState<Category>(initial?.category || 'personal');
  const [dueDate, setDueDate] = useState(initial?.dueDate || '');
  const [dueTime, setDueTime] = useState(initial?.dueTime || '');
  const [reminder, setReminder] = useState<number | ''>(initial?.reminder ?? '');
  const [recurring, setRecurring] = useState<RecurringType>(initial?.recurring ?? 'none');
  const [aiSuggestion, setAiSuggestion] = useState<ClassifyResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  const handleTitleBlur = async () => {
    if (!title.trim()) return;
    setIsClassifying(true);
    try {
      const result = await classifyTodo(title, description);
      setAiSuggestion(result);
      setImportant(result.important);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      completed: initial?.completed || false,
      urgent: false,
      important,
      category,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      reminder: reminder !== '' ? Number(reminder) : undefined,
      recurring,
    });
    onClose();
  };

  return (
    <div
      style={{ ...s.overlay, alignItems: isMobile ? 'flex-end' : 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        ...s.modal,
        borderRadius: isMobile ? '20px 20px 0 0' : 16,
        maxWidth: isMobile ? '100%' : 480,
        paddingBottom: isMobile ? 36 : 28,
      }}>
        {isMobile && <div style={s.handle} />}
        <h2 style={s.title}>{initial ? '할 일 수정' : '새 할 일'}</h2>

        <form onSubmit={handleSubmit} style={s.form}>
          {/* 제목 */}
          <div style={s.field}>
            <label style={s.label}>제목 *</label>
            <input
              style={s.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="할 일을 입력하세요"
              autoFocus
            />
          </div>

          {/* 설명 */}
          <div style={s.field}>
            <label style={s.label}>설명</label>
            <textarea
              style={{ ...s.input, height: 64, resize: 'none' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="상세 내용 (선택)"
            />
          </div>

          {/* 중요도 + AI 분류 */}
          <div style={s.field}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={s.label}>중요도</label>
              {isClassifying && (
                <span style={s.classifyingBadge}>✨ AI 분석 중...</span>
              )}
              {!isClassifying && aiSuggestion && (
                <span style={{ ...s.classifyingBadge, background: aiSuggestion.source === 'ai' ? '#ede9fe' : '#f0fdf4', color: aiSuggestion.source === 'ai' ? '#7c3aed' : '#166534' }}>
                  {aiSuggestion.source === 'ai' ? '✨ AI' : '🔍 키워드'} · {aiSuggestion.reason}
                </span>
              )}
            </div>
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

          {/* 반복 설정 */}
          <div style={s.field}>
            <label style={s.label}>반복</label>
            <div style={s.recurringRow}>
              {RECURRING_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurring(opt.value)}
                  style={{
                    ...s.recurringBtn,
                    ...(recurring === opt.value ? s.recurringActive : s.recurringInactive),
                  }}
                >
                  <span style={{ fontSize: 14 }}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 마감일 */}
          <div style={s.field}>
            <label style={s.label}>
              마감일 <span style={s.hint}>— 1개월 이내면 자동으로 "급함" 분류</span>
            </label>
            <div style={s.row}>
              <input style={{ ...s.input, flex: 1 }} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              <input style={{ ...s.input, flex: 1 }} type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
            </div>
          </div>

          {/* 카테고리 */}
          <div style={s.field}>
            <label style={s.label}>카테고리</label>
            <select style={s.select} value={category} onChange={e => setCategory(e.target.value as Category)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>

          {/* 알림 */}
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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: 28, width: '100%', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxHeight: '92vh', overflowY: 'auto' },
  handle: { width: 40, height: 4, borderRadius: 2, background: '#d1d5db', margin: '-8px auto 16px' },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1a1a2e' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
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
  classifyingBadge: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#ede9fe', color: '#7c3aed' },
  recurringRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  recurringBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  recurringActive: { background: '#eef2ff', borderColor: '#4f46e5', color: '#4f46e5' },
  recurringInactive: { background: '#fff', borderColor: '#e5e7eb', color: '#9ca3af' },
  actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
};
