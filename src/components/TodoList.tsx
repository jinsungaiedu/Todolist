import React, { useState, useRef } from 'react';
import { Todo, Category } from '../types';
import { format, parseISO, isPast } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { useIsMobile } from '../hooks/useMediaQuery';

interface Props {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onMove: (id: string, urgent: boolean, important: boolean) => void;
}

const QUADRANTS = [
  { urgent: true,  important: true,  num: 1, label: '급하고 중요',      emoji: '🔴', bg: '#fef2f2', headerBg: '#dc2626', border: '#fca5a5', dropBg: '#fee2e2' },
  { urgent: true,  important: false, num: 2, label: '급한데 덜 중요',   emoji: '🟠', bg: '#fff7ed', headerBg: '#ea580c', border: '#fdba74', dropBg: '#fed7aa' },
  { urgent: false, important: true,  num: 3, label: '안급하지만 중요',  emoji: '🔵', bg: '#eff6ff', headerBg: '#2563eb', border: '#93c5fd', dropBg: '#dbeafe' },
  { urgent: false, important: false, num: 4, label: '안급하고 덜 중요', emoji: '⚪', bg: '#f9fafb', headerBg: '#6b7280', border: '#d1d5db', dropBg: '#f3f4f6' },
];

const CATEGORY_LABEL: Record<Category, string> = {
  work: '업무', personal: '개인', health: '건강', other: '기타',
};
const CATEGORY_EMOJI: Record<Category, string> = {
  work: '💼', personal: '👤', health: '💪', other: '📌',
};

export default function TodoList({ todos, onToggle, onDelete, onEdit, onMove }: Props) {
  const isMobile = useIsMobile();
  const [showCompleted, setShowCompleted] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overQuadrant, setOverQuadrant] = useState<number | null>(null);
  const dragRef = useRef<string | null>(null);

  const active = todos.filter(t => !t.completed);
  const completed = todos.filter(t => t.completed);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragRef.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverQuadrant(null);
    dragRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, qNum: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverQuadrant(qNum);
  };

  const handleDrop = (e: React.DragEvent, urgent: boolean, important: boolean, qNum: number) => {
    e.preventDefault();
    if (dragRef.current) {
      onMove(dragRef.current, urgent, important);
    }
    setOverQuadrant(null);
    setDraggingId(null);
    dragRef.current = null;
  };

  return (
    <div style={s.container}>
      <div style={s.statsRow}>
        <span style={s.stat}>전체 {todos.length}</span>
        <span style={{ ...s.stat, color: '#4f46e5' }}>남은 항목 {active.length}</span>
        <span style={{ ...s.stat, color: '#10b981' }}>완료 {completed.length}</span>
        <span style={s.hint}>✦ 카드를 드래그해서 칸 이동</span>
      </div>

      <div style={{ ...s.matrix, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {QUADRANTS.map(q => {
          const items = active.filter(t => t.urgent === q.urgent && t.important === q.important);
          const isOver = overQuadrant === q.num;
          return (
            <div key={q.num}
              style={{
                ...s.quadrant,
                background: isOver ? q.dropBg : q.bg,
                border: `2px solid ${isOver ? q.headerBg : q.border}`,
                transition: 'all 0.15s',
              }}
              onDragOver={e => handleDragOver(e, q.num)}
              onDragLeave={() => setOverQuadrant(null)}
              onDrop={e => handleDrop(e, q.urgent, q.important, q.num)}
            >
              <div style={{ ...s.quadrantHeader, background: q.headerBg }}>
                <span style={s.quadrantNum}>{q.num}</span>
                <span style={s.quadrantTitle}>{q.emoji} {q.label}</span>
                <span style={s.quadrantCount}>{items.length}</span>
              </div>

              <div style={{ ...s.quadrantItems, minHeight: isOver ? 60 : 50 }}>
                {isOver && items.length === 0 && (
                  <div style={s.dropPlaceholder}>여기에 놓기</div>
                )}
                {items.length === 0 && !isOver ? (
                  <p style={s.emptyQ}>항목 없음</p>
                ) : (
                  items.map(todo => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      isDragging={draggingId === todo.id}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div style={s.completedSection}>
          <button style={s.completedToggle} onClick={() => setShowCompleted(v => !v)}>
            {showCompleted ? '▾' : '▸'} 완료된 항목 ({completed.length})
          </button>
          {showCompleted && (
            <div style={s.completedList}>
              {completed.map(todo => (
                <TodoCard key={todo.id} todo={todo} isDragging={false}
                  onToggle={onToggle} onDelete={onDelete} onEdit={onEdit}
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CardProps {
  todo: Todo;
  isDragging: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Todo) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

function TodoCard({ todo, isDragging, onToggle, onDelete, onEdit, onDragStart, onDragEnd }: CardProps) {
  const overdue = !todo.completed && todo.dueDate && isPast(parseISO(`${todo.dueDate}T${todo.dueTime || '23:59'}`));

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, todo.id)}
      onDragEnd={onDragEnd}
      style={{
        ...s.card,
        opacity: isDragging ? 0.4 : todo.completed ? 0.55 : 1,
        cursor: 'grab',
        transform: isDragging ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      <div style={s.cardTop}>
        <button style={{ ...s.checkbox, background: todo.completed ? '#4f46e5' : 'transparent' }}
          onClick={() => onToggle(todo.id)}>
          {todo.completed && <span style={s.checkmark}>✓</span>}
        </button>
        <span style={{ ...s.cardTitle, textDecoration: todo.completed ? 'line-through' : 'none' }}>
          {todo.title}
        </span>
        <div style={s.cardActions}>
          <button style={s.actionBtn} onClick={() => onEdit(todo)}>✏️</button>
          <button style={s.actionBtn} onClick={() => onDelete(todo.id)}>🗑️</button>
        </div>
      </div>

      {todo.description && <div style={s.cardDesc}>{todo.description}</div>}

      <div style={s.cardMeta}>
        <span style={s.metaBadge}>{CATEGORY_EMOJI[todo.category]} {CATEGORY_LABEL[todo.category]}</span>
        {todo.dueDate && (
          <span style={{ ...s.metaBadge, color: overdue ? '#ef4444' : '#6b7280' }}>
            {overdue ? '⚠️ ' : '📅 '}
            {format(parseISO(todo.dueDate), 'M/d(eee)', { locale: ko })}
            {todo.dueTime && ` ${todo.dueTime}`}
          </span>
        )}
        {todo.reminder != null && (
          <span style={s.metaBadge}>🔔 {todo.reminder < 60 ? `${todo.reminder}분` : `${todo.reminder / 60}시간`} 전</span>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 20 },
  statsRow: { display: 'flex', gap: 20, padding: '14px 20px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', alignItems: 'center' },
  stat: { fontSize: 14, fontWeight: 600, color: '#6b7280' },
  hint: { marginLeft: 'auto', fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
  matrix: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  quadrant: { borderRadius: 14, overflow: 'hidden' },
  quadrantHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', color: '#fff' },
  quadrantNum: { width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 },
  quadrantTitle: { flex: 1, fontSize: 13, fontWeight: 700 },
  quadrantCount: { background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
  quadrantItems: { padding: '8px', display: 'flex', flexDirection: 'column', gap: 6 },
  emptyQ: { fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '14px 0' },
  dropPlaceholder: { fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '14px 0', border: '2px dashed #9ca3af', borderRadius: 8 },
  card: { background: '#fff', borderRadius: 10, padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', userSelect: 'none', transition: 'transform 0.1s, opacity 0.15s' },
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  checkbox: { width: 18, height: 18, borderRadius: '50%', border: '2px solid #4f46e5', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkmark: { fontSize: 10, color: '#fff', fontWeight: 700 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.4 },
  cardDesc: { fontSize: 11, color: '#9ca3af', marginBottom: 6, paddingLeft: 26 },
  cardActions: { display: 'flex', gap: 2, flexShrink: 0 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '2px 3px', borderRadius: 4, opacity: 0.5 },
  cardMeta: { display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 26 },
  metaBadge: { fontSize: 10, color: '#6b7280' },
  completedSection: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' },
  completedToggle: { width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6b7280' },
  completedList: { padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
};
